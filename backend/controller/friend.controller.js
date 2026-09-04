import mongoose from 'mongoose';
import AccountModel from '../model/account.js';
import FriendRequestModel from '../model/friendRequest.js';

const publicAccountFields = 'Fname Lname Username role avatar';

const getDisplayName = (account) => {
    if (!account) return 'User';
    return [account.Fname, account.Lname].filter(Boolean).join(' ').trim()
        || account.Username
        || 'User';
};

const getCurrentAccount = async (id) => AccountModel.findOne({
    _id: id,
    role: { $in: ['user', 'teacher'] },
    isActive: { $ne: false },
}).select(publicAccountFields).lean();

const friendController = {
    getStatuses: async (req, res, next) => {
        try {
            const requests = await FriendRequestModel.find({
                $or: [
                    { requesterId: req.user._id },
                    { recipientId: req.user._id },
                ],
                status: { $in: ['pending', 'accepted'] },
            }).lean();

            const data = requests.map((request) => {
                const isRequester = String(request.requesterId) === String(req.user._id);
                return {
                    userId: isRequester ? request.recipientId : request.requesterId,
                    requestId: request._id,
                    status: request.status === 'accepted'
                        ? 'accepted'
                        : (isRequester ? 'pending' : 'incoming'),
                };
            });

            res.status(200).json({ data, success: true });
        } catch (error) {
            next(error);
        }
    },

    getIncomingRequests: async (req, res, next) => {
        try {
            const requests = await FriendRequestModel.find({
                recipientId: req.user._id,
                status: 'pending',
            })
                .populate('requesterId', publicAccountFields)
                .sort({ createdAt: -1 })
                .lean();

            const data = requests.map((request) => {
                const sender = request.requesterId;
                const senderName = sender?.Username || getDisplayName(sender);
                return {
                    id: request._id,
                    requesterId: sender?._id,
                    actorName: senderName,
                    actorRole: sender?.role,
                    actorAvatar: sender?.avatar,
                    message: `${senderName} wants to add you as a friend`,
                    createdAt: request.createdAt,
                    type: 'friend_request',
                    status: request.status,
                };
            });

            res.status(200).json({ data, count: data.length, success: true });
        } catch (error) {
            next(error);
        }
    },

    sendRequest: async (req, res, next) => {
        try {
            const { recipientId } = req.body;
            if (!mongoose.Types.ObjectId.isValid(recipientId)) {
                return res.status(400).json({ success: false, message: 'Invalid recipient account' });
            }

            const requester = await getCurrentAccount(req.user._id);
            const recipient = await AccountModel.findOne({
                _id: recipientId,
                role: { $in: ['user', 'teacher'] },
                isActive: { $ne: false },
            }).select(publicAccountFields).lean();

            if (!requester || !recipient) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }
            if (String(requester._id) === String(recipient._id)) {
                return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend' });
            }

            const existingRequest = await FriendRequestModel.findOne({
                $or: [
                    { requesterId: requester._id, recipientId: recipient._id },
                    { requesterId: recipient._id, recipientId: requester._id },
                ],
            }).sort({ createdAt: -1 });

            if (existingRequest?.status === 'accepted') {
                return res.status(409).json({ success: false, message: 'These accounts are already friends' });
            }
            if (existingRequest?.status === 'pending') {
                return res.status(409).json({ success: false, message: 'A friend request is already pending' });
            }

            const request = existingRequest || new FriendRequestModel();
            request.requesterId = requester._id;
            request.recipientId = recipient._id;
            request.status = 'pending';
            await request.save();

            res.status(201).json({
                data: { id: request._id, status: request.status, recipientId: recipient._id },
                success: true,
                message: 'Friend request sent successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    respondToRequest: async (req, res, next) => {
        try {
            const { action } = req.body;
            if (!['accept', 'reject'].includes(action)) {
                return res.status(400).json({ success: false, message: 'Invalid action' });
            }
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ success: false, message: 'Invalid friend request' });
            }

            const request = await FriendRequestModel.findOne({
                _id: req.params.id,
                recipientId: req.user._id,
                status: 'pending',
            });
            if (!request) {
                return res.status(404).json({ success: false, message: 'Friend request no longer exists' });
            }

            request.status = action === 'accept' ? 'accepted' : 'rejected';
            await request.save();

            res.status(200).json({
                data: { id: request._id, status: request.status, userId: request.requesterId },
                success: true,
                message: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
            });
        } catch (error) {
            next(error);
        }
    },
};

export default friendController;
