// backend/src/utils/momo.js
import crypto from 'crypto';
import axios from 'axios';

const {
  MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY,
  MOMO_ENDPOINT,       // https://test-payment.momo.vn/v2/gateway/api/create
  MOMO_REDIRECT_URL,   // trang frontend user thấy sau khi thanh toán (vd: http://localhost:5173/payment-result)
  MOMO_IPN_URL,        // URL public (ngrok) trỏ tới POST /account/momo/ipn
} = process.env;

// Tạo link thanh toán MoMo cho 1 order
export const createMomoPayment = async ({ orderId, amount, orderInfo, requestType = 'payWithATM' }) => {
  const VALID_TYPES = ['captureWallet', 'payWithATM', 'payWithCC'];
  if (!VALID_TYPES.includes(requestType)) requestType = 'payWithATM';

  const requestId = `${Date.now()}_${orderId}`;
  const extraData = '';
  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&ipnUrl=${MOMO_IPN_URL}&orderId=${orderId}&orderInfo=${orderInfo}` +
    `&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${MOMO_REDIRECT_URL}` +
    `&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl: MOMO_REDIRECT_URL,
    ipnUrl: MOMO_IPN_URL,
    extraData,
    requestType,
    signature,
    lang: 'vi',
  };

  const { data } = await axios.post(MOMO_ENDPOINT, body);
  return data; // data.payUrl, data.resultCode, data.requestId...
};

// Kiểm tra chữ ký MoMo gửi về ở IPN, tránh giả mạo callback
export const verifyMomoSignature = (payload) => {
  const {
    partnerCode, orderId, requestId, amount, orderInfo, orderType,
    transId, resultCode, message, payType, responseTime, extraData, signature,
  } = payload;

  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}` +
    `&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}` +
    `&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const expected = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  return expected === signature;
};