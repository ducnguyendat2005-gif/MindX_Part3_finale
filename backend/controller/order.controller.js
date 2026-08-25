import OrderModel from '../model/order.js';
import EnrollmentModel from '../model/enrollment.js';
import CourseModel from '../model/courses.js';
import CouponModel from '../model/coupon.js';
import { createMomoPayment, verifyMomoSignature } from '../src/utils/momo.js';
import { createVnpayUrl, verifyVnpaySignature } from '../src/utils/vnpay.js';

// Tỷ giá tạm để demo — DB đang lưu giá USD, MoMo/VNPay chỉ nhận VND
const USD_TO_VND = 25000;

const getSalePrice = (course) => {
  const originalPrice = Number(course.price) || 0;
  const promotionalPrice = Number(course.promotionalPrice);
  return promotionalPrice > 0 && promotionalPrice < originalPrice
    ? promotionalPrice
    : originalPrice;
};

// Tính subtotal/discount/total dùng chung cho cả MoMo & VNPay (tránh lặp code)
const buildOrderData = async (courseIds, couponCode) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    const err = new Error('Giỏ hàng trống');
    err.status = 400;
    throw err;
  }

  const courses = await CourseModel.find({ _id: { $in: courseIds } });
  if (courses.length !== courseIds.length) {
    const err = new Error('Có khóa học không tồn tại');
    err.status = 400;
    throw err;
  }

  const items = courses.map(c => ({
    courseId: c._id,
    price: getSalePrice(c),
    title: c.title,  
  }));
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const tax = 20;

  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coup = await CouponModel.findOne({ code: couponCode, isActive: true });
    if (!coup) {
      const err = new Error('Mã giảm giá không hợp lệ');
      err.status = 400;
      throw err;
    }
    const now = new Date();
    if (coup.expiresAt && coup.expiresAt < now) {
      const err = new Error('Mã đã hết hạn');
      err.status = 400;
      throw err;
    }
    if (coup.maxUses !== null && coup.usedCount >= coup.maxUses) {
      const err = new Error('Mã đã hết lượt dùng');
      err.status = 400;
      throw err;
    }

    discount = coup.discountType === 'number'
      ? Math.min(coup.discountValue, subtotal)
      : Number((subtotal * Math.min(Math.max(coup.discountValue, 0), 100) / 100).toFixed(2));

    appliedCoupon = coup.code;
  }

  const total = Math.max(subtotal - discount + tax, 0);

  return { items, subtotal, discount, tax, total, appliedCoupon };
};

// Trừ lượt coupon + tạo enrollment — dùng chung cho MoMo IPN & VNPay return
const finalizeSuccessfulOrder = async (order) => {
  if (order.couponCode) {
    await CouponModel.findOneAndUpdate(
      { code: order.couponCode },
      { $inc: { usedCount: 1 } }
    );
  }

  const enrollmentOps = order.items.map(item => ({
    updateOne: {
      filter: { accountId: order.accountId, courseId: item.courseId },
      update: { $setOnInsert: { accountId: order.accountId, courseId: item.courseId } },
      upsert: true,
    },
  }));
  await EnrollmentModel.bulkWrite(enrollmentOps);
};

// ───────────── MoMo ─────────────

// POST /account/momo/create
const createMomoOrder = async (req, res, next) => {
  try {
    const accountId = req.user._id;
    const { courseIds, couponCode, requestType } = req.body; // 👈 thêm requestType
    const { items, subtotal, discount, tax, total, appliedCoupon } =
      await buildOrderData(courseIds, couponCode);

    const amountVnd = Math.round(total * USD_TO_VND);

    const order = await OrderModel.create({
      accountId, items, subtotal, discount, couponCode: appliedCoupon,
      tax, total, amountVnd, paymentMethod: 'momo', status: 'pending',
    });

    const momoRes = await createMomoPayment({
      orderId: order._id.toString(),
      amount: amountVnd,
      orderInfo: `Thanh toan don hang ${order._id}`,
      requestType, // 👈 truyền xuống, undefined thì momo.js tự default 'payWithATM'
    });

    if (momoRes.resultCode !== 0) {
      order.status = 'failed';
      await order.save();
      return res.status(400).json({ message: momoRes.message || 'Tạo giao dịch MoMo thất bại', success: false });
    }

    order.providerOrderId = momoRes.requestId;
    await order.save();

    res.json({
      data: { payUrl: momoRes.payUrl, orderId: order._id },
      message: 'Tạo giao dịch MoMo thành công',
      success: true,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, success: false });
    next(err);
  }
};

// POST /account/momo/ipn — MoMo gọi server-to-server, KHÔNG qua verifyToken
const momoIPN = async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.partnerCode) {
      return res.status(400).json({ message: 'Empty or invalid IPN payload' });
    }
    if (!verifyMomoSignature(payload)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const order = await OrderModel.findById(payload.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (Number(payload.resultCode) === 0) {
      if (order.status !== 'succeeded') {
        order.status = 'succeeded';
        order.providerTransId = String(payload.transId);
        order.payType = payload.payType || null;  
        order.paidAt = new Date();                  
        await order.save();
        await finalizeSuccessfulOrder(order);
      }
    } else {
      order.status = 'failed';
      order.failureReason = `${payload.resultCode}: ${payload.message || ''}`; // 👈 thêm
      await order.save();
    }

    // MoMo chỉ cần nhận HTTP 204/200, không đọc body
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// ───────────── VNPay ─────────────

// POST /account/vnpay/create
const createVnpayOrder = async (req, res, next) => {
  try {
    const accountId = req.user._id;
    const { courseIds, couponCode } = req.body;
    const { items, subtotal, discount, tax, total, appliedCoupon } =
      await buildOrderData(courseIds, couponCode);

    const amountVnd = Math.round(total * USD_TO_VND);

    const order = await OrderModel.create({
      accountId, items, subtotal, discount, couponCode: appliedCoupon,
      tax, total, amountVnd, paymentMethod: 'vnpay', status: 'pending',
    });

    const ipAddr = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    const payUrl = createVnpayUrl({
      orderId: order._id.toString(),
      amount: amountVnd,
      orderInfo: `Thanh toan don hang ${order._id}`,
      ipAddr,
    });

    res.json({
      data: { payUrl, orderId: order._id },
      message: 'Tạo giao dịch VNPay thành công',
      success: true,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, success: false });
    next(err);
  }
};

// GET /account/vnpay/return — VNPay redirect trình duyệt user về đây kèm query string
const vnpayReturn = async (req, res, next) => {
  try {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const valid = verifyVnpaySignature(req.query);

    if (!valid) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=invalid`);
    }

    const order = await OrderModel.findById(req.query.vnp_TxnRef);
    if (!order) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=notfound`);
    }

    if (req.query.vnp_ResponseCode === '00') {
      if (order.status !== 'succeeded') {
        order.status = 'succeeded';
        order.providerTransId = req.query.vnp_TransactionNo;
        await order.save();
        await finalizeSuccessfulOrder(order);
      }
      return res.redirect(`${FRONTEND_URL}/payment-result?status=success&orderId=${order._id}`);
    }

    order.status = 'failed';
    await order.save();
    return res.redirect(`${FRONTEND_URL}/payment-result?status=failed`);
  } catch (err) {
    next(err);
  }
};

const vnpayIPN = async (req, res, next) => {
  try {
    const query = req.query;
    const signatureValid = verifyVnpaySignature(query);

    const order = await OrderModel.findById(query.vnp_TxnRef);

    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // Ghi log MỌI lần IPN gọi tới, kể cả chữ ký sai/giả mạo — để demo Compass
    order.ipnLogs.push({
      rawPayload: query,
      signatureValid,
      resultCode: query.vnp_ResponseCode,
    });
    await order.save();

    if (!signatureValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    // Kiểm tra số tiền khớp — tránh giả mạo IPN với amount khác
    const expectedAmount = Math.round(order.amountVnd) * 100;
    if (Number(query.vnp_Amount) !== expectedAmount) {
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (order.status === 'succeeded' || order.status === 'failed') {
      // Đơn đã được xử lý (có thể do vnpayReturn xử lý trước) — vẫn báo VNPay là OK
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }

    if (query.vnp_ResponseCode === '00') {
      order.status = 'succeeded';
      order.providerTransId = query.vnp_TransactionNo;
      order.paidAt = new Date();
      await order.save();
      await finalizeSuccessfulOrder(order);
    } else {
      order.status = 'failed';
      order.failureReason = `${query.vnp_ResponseCode}: ${query.vnp_Message || ''}`;
      await order.save();
    }

    res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (err) {
    next(err);
  }
};
export default { createMomoOrder, momoIPN, createVnpayOrder, vnpayReturn ,vnpayIPN};
