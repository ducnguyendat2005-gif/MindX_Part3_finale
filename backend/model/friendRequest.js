import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

friendRequestSchema.index({ requesterId: 1, recipientId: 1, status: 1 });
friendRequestSchema.index({ recipientId: 1, status: 1, createdAt: -1 });

const FriendRequestModel = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequestModel;
