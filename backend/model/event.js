import mongoose from 'mongoose';

// Một "câu hỏi" (question) giờ là 1 đơn vị chơi chung cho cả 3 loại game.
// Field nào không dùng tới với gameType hiện tại thì cứ để trống — validate
// "đúng đủ field theo gameType" được xử lý ở buildEventQuestions.js (backend)
// and validateForm (frontend), KHÔNG ép cứng required ở schema để tránh xung đột
// giữa 3 loại game dùng chung 1 schema.
const eventQuestionSchema = new mongoose.Schema({
    basePoints: { type: Number, default: 100 },
    timeLimitSeconds: { type: Number, default: 30 },

    // ── Quiz ──
    questionText: { type: String, trim: true },
    options: { type: [String], default: undefined },
    correctIndex: { type: Number },

    // ── Unscramble letter ──
    word: { type: String, trim: true, uppercase: true },
    hint: { type: String, trim: true, default: '' },

    // ── Matching pairs ──
    // Mỗi "câu" matching có thể chứa nhiều cặp cùng lúc (1 round = nhiều pairs)
    pairs: {
        type: [{
            _id: false,
            left: { type: String, trim: true },
            right: { type: String, trim: true },
        }],
        default: undefined,
    },
});

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Áp dụng cho CẢ sự kiện — 1 sự kiện chỉ chơi 1 loại game duy nhất
    gameType: {
        type: String,
        enum: ['quiz', 'unscramble', 'matching'],
        default: 'quiz',
    },

    questions: { type: [eventQuestionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },

    scoringConfig: {
        speedBonusMaxRatio: { type: Number, default: 0.5 },
        streakBonusPerDay: { type: Number, default: 0.05 },
        streakMultiplierCap: { type: Number, default: 1.5 },
    },

    // THÊM MỚI — đánh dấu đã phát thưởng top 3 chưa, tránh cron job phát trùng
    // mỗi lần chạy. Chỉ được set true bởi eventRewardJob, không expose cho
    // client/admin chỉnh tay.
    rewardsDistributed: { type: Boolean, default: false },
}, { timestamps: true });

eventSchema.methods.getComputedStatus = function () {
    const now = new Date();
    if (now < this.startDate) return 'upcoming';
    if (now > this.endDate) return 'ended';
    return 'active';
};

const EventModel = mongoose.model('Events', eventSchema);

export default EventModel;