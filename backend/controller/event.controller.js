import EventModel from '../model/event.js';
import EventScoreModel from '../model/eventScore.js';
import { badRequest, notFound, conflict } from '../middleware/appError.middleware.js';

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Chấm điểm theo từng gameType ──
// Mỗi hàm trả về { isCorrect, pointsEarned } trước khi nhân hệ số streak.
// cappedTime tính bằng ms, đã giới hạn trong [0, timeLimitSeconds*1000].

function scoreQuiz(question, answer, cappedTime, speedBonusMaxRatio) {
    const { selectedIndex } = answer;
    if (typeof selectedIndex !== 'number') {
        throw badRequest('selectedIndex is required and must be valid');
    }
    const isCorrect = selectedIndex === question.correctIndex;
    let pointsEarned = 0;
    if (isCorrect) {
        const timeRatio = 1 - cappedTime / (question.timeLimitSeconds * 1000);
        const speedBonus = Math.round(question.basePoints * speedBonusMaxRatio * timeRatio);
        pointsEarned = question.basePoints + speedBonus;
    }
    return { isCorrect, pointsEarned };
}

function scoreUnscramble(question, answer, cappedTime, speedBonusMaxRatio) {
    if (typeof answer.submittedWord !== 'string') {
        throw badRequest('submittedWord is required');
    }
    // Chuỗi rỗng (hết giờ mà chưa ghép chữ nào) là hợp lệ — tính là trả lời sai,
    // không phải lỗi request.
    const submittedWord = answer.submittedWord.trim().toUpperCase();
    const isCorrect = submittedWord.length > 0 && submittedWord === question.word;
    let pointsEarned = 0;
    if (isCorrect) {
        const timeRatio = 1 - cappedTime / (question.timeLimitSeconds * 1000);
        const speedBonus = Math.round(question.basePoints * speedBonusMaxRatio * timeRatio);
        pointsEarned = question.basePoints + speedBonus;
    }
    return { isCorrect, pointsEarned };
}

function scoreMatching(question, answer, cappedTime, speedBonusMaxRatio) {
    const submittedPairs = Array.isArray(answer.submittedPairs) ? answer.submittedPairs : null;
    if (!submittedPairs) {
        throw badRequest('submittedPairs is required');
    }
    const total = question.pairs.length;
    const correctCount = submittedPairs.filter((sp) =>
        question.pairs.some((p) => p.left === sp.left && p.right === sp.right)
    ).length;

    const isCorrect = total > 0 && correctCount === total;
    let pointsEarned = 0;
    if (correctCount > 0) {
        const timeRatio = 1 - cappedTime / (question.timeLimitSeconds * 1000);
        const speedBonus = Math.round(question.basePoints * speedBonusMaxRatio * timeRatio);
        // Điểm theo tỉ lệ số cặp nối đúng, speed bonus cũng chia theo tỉ lệ đó
        const ratio = correctCount / total;
        pointsEarned = Math.round(question.basePoints * ratio + speedBonus * ratio);
    }
    return { isCorrect, pointsEarned, correctCount, totalPairs: total };
}

const SCORERS = {
    quiz: scoreQuiz,
    unscramble: scoreUnscramble,
    matching: scoreMatching,
};

export default {
    getActiveEvents: async (req, res, next) => {
        try {
            const now = new Date();
            const events = await EventModel.find({
                startDate: { $lte: now },
                endDate: { $gte: now },
            }).select('-questions.correctIndex -questions.word');
            res.json({ success: true, data: events });
        } catch (err) {
            next(err);
        }
    },

    getEventById: async (req, res, next) => {
        try {
            // Ẩn đáp án đúng theo từng gameType: quiz giấu correctIndex,
            // unscramble giấu word gốc (chỉ để lộ khi FE tự xáo trộn xong nên
            // thực ra FE vẫn cần word để xáo — xem ghi chú phía dưới),
            // matching giấu field pairs.right tương ứng đúng vị trí left.
            //
            // Lưu ý: với unscramble, client BẮT BUỘC phải biết các chữ cái để
            // hiển thị ô xáo trộn, nên ta không thể giấu "word" hoàn toàn như
            // correctIndex của quiz — việc "giấu đáp án" ở đây chỉ mang tính
            // tương đối (giống cách các app unscramble khác vẫn gửi thẳng chữ
            // cái cho client). Nếu cần chống gian lận tuyệt đối, phải xáo trộn
            // and chấm điểm hoàn toàn ở server — có thể làm ở bản nâng cấp sau.
            const event = await EventModel.findById(req.params.eventId).select('-questions.correctIndex');
            if (!event) throw notFound('Event not found');
            res.json({ success: true, data: event });
        } catch (err) {
            next(err);
        }
    },

    submitAnswer: async (req, res, next) => {
        try {
            const { eventId } = req.params;
            const { questionId, timeTakenMs, selectedIndex, submittedWord, submittedPairs } = req.body;
            const accountId = req.user._id;

            if (!questionId || typeof timeTakenMs !== 'number') {
                throw badRequest('questionId and timeTakenMs are required and must be valid');
            }

            const event = await EventModel.findById(eventId);
            if (!event) throw notFound('Event not found');

            const status = event.getComputedStatus();
            if (status !== 'active') {
                throw badRequest(`This event is not open (status: ${status})`);
            }

            const question = event.questions.id(questionId);
            if (!question) throw badRequest('Invalid questionId');

            let score = await EventScoreModel.findOne({ accountId, eventId });
            if (!score) {
                score = new EventScoreModel({ accountId, eventId });
            }

            const alreadyAnswered = score.attemptsLog.some(
                (a) => a.questionId.toString() === questionId.toString()
            );
            if (alreadyAnswered) {
                throw conflict('You have already answered this question');
            }

            const { speedBonusMaxRatio, streakBonusPerDay, streakMultiplierCap } = event.scoringConfig;
            const cappedTime = Math.max(0, Math.min(timeTakenMs, question.timeLimitSeconds * 1000));

            const scorer = SCORERS[event.gameType];
            if (!scorer) throw badRequest('Invalid event game type');

            const { isCorrect, pointsEarned: basePointsEarned } = scorer(
                question,
                { selectedIndex, submittedWord, submittedPairs },
                cappedTime,
                speedBonusMaxRatio
            );
            let pointsEarned = basePointsEarned;

            const today = todayStr();
            if (score.lastPlayedDate !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                score.currentStreak = score.lastPlayedDate === yesterday ? score.currentStreak + 1 : 1;
                score.longestStreak = Math.max(score.longestStreak, score.currentStreak);
                score.lastPlayedDate = today;
            }

            const streakMultiplier = Math.min(1 + score.currentStreak * streakBonusPerDay, streakMultiplierCap);
            pointsEarned = Math.round(pointsEarned * streakMultiplier);

            score.attemptsLog.push({ questionId: question._id, isCorrect, timeTakenMs: cappedTime, pointsEarned });
            score.totalScore += pointsEarned;

            await score.save();

            res.json({
                success: true,
                data: {
                    isCorrect,
                    pointsEarned,
                    totalScore: score.totalScore,
                    currentStreak: score.currentStreak,
                },
            });
        } catch (err) {
            next(err);
        }
    },

    setDisplayMode: async (req, res, next) => {
        try {
            const { eventId } = req.params;
            const { displayMode, nickname } = req.body;
            const accountId = req.user._id;

            if (!['realname', 'nickname', 'anonymous'].includes(displayMode)) {
                throw badRequest('Invalid display mode');
            }
            if (displayMode === 'nickname' && !nickname?.trim()) {
                throw badRequest('A nickname is required when displaying a nickname');
            }

            let score = await EventScoreModel.findOne({ accountId, eventId });
            if (!score) {
                score = new EventScoreModel({ accountId, eventId });
            } else if (score.attemptsLog.length > 0) {
                throw conflict('You have already started playing and cannot change the display mode');
            }

            score.displayMode = displayMode;
            score.nickname = displayMode === 'nickname' ? nickname.trim() : '';
            await score.save();

            res.json({ success: true, data: { displayMode: score.displayMode, nickname: score.nickname } });
        } catch (err) {
            next(err);
        }
    },

    getLeaderboard: async (req, res, next) => {
        try {
            const { eventId } = req.params;
            const scores = await EventScoreModel.find({ eventId })
                .sort({ totalScore: -1 })
                .limit(50)
                .populate('accountId', 'Username Fname Lname avatar');

            const leaderboard = scores.map((s, index) => {
                let displayName = 'Anonymous student';
                if (s.displayMode === 'realname') {
                    displayName = s.accountId?.Username || `${s.accountId?.Fname || ''} ${s.accountId?.Lname || ''}`.trim();
                } else if (s.displayMode === 'nickname') {
                    displayName = s.nickname;
                }

                return {
                    rank: index + 1,
                    displayName,
                    totalScore: s.totalScore,
                    currentStreak: s.currentStreak,
                    avatar: s.displayMode === 'anonymous' ? null : s.accountId?.avatar,
                };
            });

            res.json({ success: true, data: leaderboard });
        } catch (err) {
            next(err);
        }
    },
      getMyScore: async (req, res, next) => {
        try {
            const { eventId } = req.params;
            const accountId = req.user._id;

            const score = await EventScoreModel.findOne({ accountId, eventId });
            const hasPlayed = Boolean(score && score.attemptsLog.length > 0);

            res.json({
                success: true,
                data: hasPlayed
                    ? {
                          hasPlayed: true,
                          totalScore: score.totalScore,
                          currentStreak: score.currentStreak,
                      }
                    : { hasPlayed: false },
            });
        } catch (err) {
            next(err);
        }
    },
};