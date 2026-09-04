import mongoose from 'mongoose';

const attemptLogSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // đổi từ questionIndex
    isCorrect: { type: Boolean, required: true },
    timeTakenMs: { type: Number, required: true },
    pointsEarned: { type: Number, required: true },
    answeredAt: { type: Date, default: Date.now },
}, { _id: false });

const eventScoreSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Events', required: true },
    totalScore: { type: Number, default: 0 },
    attemptsLog: { type: [attemptLogSchema], default: [] },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastPlayedDate: { type: String, default: null },
    displayMode: {
        type: String,
        enum: ['realname', 'nickname', 'anonymous'],
        default: 'realname',
    },
    nickname: { type: String, default: '', trim: true },

    // THÊM MỚI — mã coupon thưởng đã cấp cho người chơi này ở event này (nếu
    // lọt top 3 khi event kết thúc). null nghĩa là chưa được cấp / không đủ
    // điều kiện. Chỉ được set bởi eventRewardJob.
    rewardCouponCode: { type: String, default: null },
}, { timestamps: true });

eventScoreSchema.index({ accountId: 1, eventId: 1 }, { unique: true });

const EventScoreModel = mongoose.model('EventScores', eventScoreSchema);

export default EventScoreModel;