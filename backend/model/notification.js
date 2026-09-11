import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
    type: {
        type: String,
        enum: ['event_reward', 'course_hidden', 'course_unhidden', 'course_rejected'],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // eventId, couponCode, rank, ...
    read: { type: Boolean, default: false },
    // Thời điểm thông báo phần thưởng không còn hiệu lực.
    // Notification không có thời hạn (ví dụ thông báo hệ thống) để null.
    expiresAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ accountId: 1, read: 1, createdAt: -1 });
// MongoDB sẽ tự xoá notification hết hạn; controller vẫn lọc thêm để không
// phụ thuộc vào thời gian chạy TTL monitor (thường có thể trễ tối đa khoảng 1 phút).
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const NotificationModel = mongoose.model('Notifications', notificationSchema);

export default NotificationModel;
