// backend/model/order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true },
    price: { type: Number, required: true },       // giá tại thời điểm mua (lock giá)
    title: { type: String },   
}, { _id: false });

const ipnLogSchema = new mongoose.Schema({
    rawPayload: { type: mongoose.Schema.Types.Mixed, required: true }, // toàn bộ body MoMo/VNPay gửi về
    signatureValid: { type: Boolean, required: true },                 // kết quả verify chữ ký
    resultCode: { type: mongoose.Schema.Types.Mixed },                 // resultCode (MoMo) / vnp_ResponseCode (VNPay)
    receivedAt: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },           // vẫn lưu USD (giá gốc hệ thống)
    amountVnd: { type: Number },                        // số tiền quy đổi thực gửi cho MoMo/VNPay
    providerOrderId: { type: String },                   // requestId (MoMo) / vnp_TxnRef (VNPay, = order._id nên có thể bỏ)
    providerTransId: { type: String },                   // mã giao dịch bên MoMo/VNPay trả về sau khi thành công
    paymentMethod: { type: String, enum: ['momo', 'vnpay'], required: true },
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending',
    },
    payType: { type: String, default: null },       // MoMo: 'qr', 'webApp', 'napas', ... (VNPay: vnp_CardType)
    failureReason: { type: String, default: null },  // resultCode/message khi fail, để biết vì sao
    paidAt: { type: Date, default: null },
    ipnLogs: { type: [ipnLogSchema], default: [] },   // lưu MỌI lần IPN gọi tới, kể cả trùng lặp/giả mạo
}, { timestamps: true });

const OrderModel = mongoose.model('Orders', orderSchema);

export default OrderModel;