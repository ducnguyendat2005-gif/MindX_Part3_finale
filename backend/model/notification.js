import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
    type: {
        type: String,
        enum: ['event_reward'], // mở rộng thêm loại khác ở đây khi cần
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // eventId, couponCode, rank, ...
    read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ accountId: 1, read: 1, createdAt: -1 });

const NotificationModel = mongoose.model('Notifications', notificationSchema);

export default NotificationModel;