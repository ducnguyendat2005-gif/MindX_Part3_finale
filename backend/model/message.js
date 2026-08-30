import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const MessageModel = mongoose.model('Message', messageSchema);

export default MessageModel;
