// backend/src/utils/vnpay.js
import crypto from 'crypto';
import qs from 'qs';

const {
  VNPAY_TMN_CODE,
  VNPAY_HASH_SECRET,
  VNPAY_URL,          // https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  VNPAY_RETURN_URL,   // URL VNPay redirect trình duyệt user về sau khi thanh toán
} = process.env;

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach((key) => { sorted[key] = obj[key]; });
  return sorted;
}

// Tạo URL để redirect user sang cổng VNPay
export const createVnpayUrl = ({ orderId, amount, orderInfo, ipAddr }) => {
  const date = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const createDate =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount) * 100, // VNPay yêu cầu nhân 100 (không có phần thập phân)
    vnp_ReturnUrl: VNPAY_RETURN_URL,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });
  const secureHash = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  vnp_Params.vnp_SecureHash = secureHash;

  return `${VNPAY_URL}?${qs.stringify(vnp_Params, { encode: false })}`;
};

// Kiểm tra chữ ký khi VNPay redirect user về returnUrl
export const verifyVnpaySignature = (query) => {
  const vnp_Params = { ...query };
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sorted = sortObject(vnp_Params);
  const signData = qs.stringify(sorted, { encode: false });
  const checkSum = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return checkSum === secureHash;
};