import mongoose from 'mongoose';
import AccountModel from '../model/account.js';
import FriendRequestModel from '../model/friendRequest.js';
import MessageModel from '../model/message.js';

const publicAccountFields = 'Fname Lname Username role avatar';

const getDisplayName = (account) => {
    if (!account) return 'Người dùng';
    return [account.Fname, account.Lname].filter(Boolean).join(' ').trim()
        || account.Username
        || 'Người dùng';
};

const isFriend = (firstId, secondId) => FriendRequestModel.exists({
    $or: [
        { requesterId: firstId, recipientId: secondId },
        { requesterId: secondId, recipientId: firstId },
    ],
    status: 'accepted',
});

const getTargetAccount = (id) => AccountModel.findOne({
    _id: id,
    role: { $in: ['user', 'teacher'] },
    isActive: { $ne: false },
}).select(publicAccountFields).lean();

const messageController = {
    getConversations: async (req, res, next) => {
        try {
            const messages = await MessageModel.find({
                $or: [
                    { senderId: req.user._id },
                    { recipientId: req.user._id },
                ],
            }).sort({ createdAt: -1 }).lean();

            const conversations = new Map();
            for (const message of messages) {
                const otherId = String(message.senderId) === String(req.user._id)
                    ? message.recipientId
                    : message.senderId;
                const key = String(otherId);
                const current = conversations.get(key) || {
                    accountId: otherId,
                    lastMessage: message.text,
                    lastMessageAt: message.createdAt,
                    unreadCount: 0,
                };
                if (String(message.recipientId) === String(req.user._id) && !message.read) {
                    current.unreadCount += 1;
                }
                conversations.set(key, current);
            }

            const accountIds = [...conversations.values()].map((conversation) => conversation.accountId);
            const accounts = await AccountModel.find({ _id: { $in: accountIds } })
                .select(publicAccountFields)
                .lean();
            const accountsById = new Map(accounts.map((account) => [String(account._id), account]));

            const data = [...conversations.values()]
                .map((conversation) => {
                    const account = accountsById.get(String(conversation.accountId));
                    return account ? {
                        ...conversation,
                        name: getDisplayName(account),
                        username: account.Username,
                        avatar: account.avatar,
                        role: account.role,
                    } : null;
                })
                .filter(Boolean);

            res.status(200).json({ data, success: true });
        } catch (error) {
            next(error);
        }
    },

    getConversation: async (req, res, next) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
                return res.status(400).json({ success: false, message: 'Tài khoản không hợp lệ' });
            }

            const target = await getTargetAccount(req.params.userId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
            }
            if (!(await isFriend(req.user._id, target._id))) {
                return res.status(403).json({ success: false, message: 'Chỉ có thể nhắn tin với bạn bè' });
            }

            await MessageModel.updateMany(
                { senderId: target._id, recipientId: req.user._id, read: false },
                { $set: { read: true } }
            );

            const messages = await MessageModel.find({
                $or: [
                    { senderId: req.user._id, recipientId: target._id },
                    { senderId: target._id, recipientId: req.user._id },
                ],
            }).sort({ createdAt: 1 }).lean();

            res.status(200).json({
                data: messages.map((message) => ({
                    id: message._id,
                    senderId: message.senderId,
                    recipientId: message.recipientId,
                    text: message.text,
                    createdAt: message.createdAt,
                    from: String(message.senderId) === String(req.user._id) ? 'me' : 'them',
                })),
                contact: {
                    accountId: target._id,
                    name: getDisplayName(target),
                    username: target.Username,
                    avatar: target.avatar,
                    role: target.role,
                },
                success: true,
            });
        } catch (error) {
            next(error);
        }
    },

    sendMessage: async (req, res, next) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
                return res.status(400).json({ success: false, message: 'Tài khoản không hợp lệ' });
            }
            const text = String(req.body.text || '').trim();
            if (!text) {
                return res.status(400).json({ success: false, message: 'Tin nhắn không được để trống' });
            }

            const target = await getTargetAccount(req.params.userId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
            }
            if (!(await isFriend(req.user._id, target._id))) {
                return res.status(403).json({ success: false, message: 'Chỉ có thể nhắn tin với bạn bè' });
            }

            const message = await MessageModel.create({
                senderId: req.user._id,
                recipientId: target._id,
                text,
            });

            res.status(201).json({
                data: {
                    id: message._id,
                    senderId: message.senderId,
                    recipientId: message.recipientId,
                    text: message.text,
                    createdAt: message.createdAt,
                    from: 'me',
                },
                success: true,
                message: 'Đã gửi tin nhắn',
            });
        } catch (error) {
            next(error);
        }
    },

    getUnreadNotifications: async (req, res, next) => {
        try {
            const account = await AccountModel.findById(req.user._id)
                .select('role welcomeNotificationRead createdAt')
                .lean();
            const messages = await MessageModel.find({
                recipientId: req.user._id,
                read: false,
            }).sort({ createdAt: -1 }).lean();
            const senderIds = [...new Set(messages.map((message) => String(message.senderId)))];
            const senders = await AccountModel.find({ _id: { $in: senderIds } })
                .select(publicAccountFields)
                .lean();
            const sendersById = new Map(senders.map((sender) => [String(sender._id), sender]));

            const data = messages.map((message) => {
                const sender = sendersById.get(String(message.senderId));
                const senderName = sender?.Username || getDisplayName(sender);
                return {
                    id: message._id,
                    accountId: message.senderId,
                    actorName: senderName,
                    actorRole: sender?.role,
                    actorAvatar: sender?.avatar,
                    message: `${senderName} đã phản hồi: ${message.text}`,
                    createdAt: message.createdAt,
                    type: 'message',
                };
            });

            if (account?.welcomeNotificationRead === false) {
                const roleLabel = account.role === 'teacher' ? 'teacher' : 'student';
                data.unshift({
                    id: `welcome-${account._id}`,
                    actorName: 'Byway',
                    actorRole: account.role,
                    actorAvatar: '',
                    message: `Chào mừng người mới ${roleLabel}!`,
                    createdAt: account.createdAt,
                    type: 'welcome',
                });
            }

            res.status(200).json({ data, count: data.length, success: true });
        } catch (error) {
            next(error);
        }
    },

    markWelcomeNotificationRead: async (req, res, next) => {
        try {
            await AccountModel.findByIdAndUpdate(req.user._id, {
                $set: { welcomeNotificationRead: true },
            });
            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    },
};

export default messageController;
