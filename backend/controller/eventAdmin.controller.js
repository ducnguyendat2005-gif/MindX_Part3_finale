import EventModel from '../model/event.js';
import { badRequest, notFound } from '../middleware/appError.middleware.js';
import { buildEventQuestions } from '../src/utils/buildEventQuetions.js';

const GAME_TYPES = ['quiz', 'unscramble', 'matching'];

const validateQuestions = (questions, gameType) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw badRequest('At least one question is required');
    }

    questions.forEach((question, index) => {
        const number = index + 1;
        if (!Number.isFinite(Number(question.basePoints)) || Number(question.basePoints) < 0) {
            throw badRequest(`Question ${number}: base score must be a non-negative number`);
        }
        if (!Number.isFinite(Number(question.timeLimitSeconds)) || Number(question.timeLimitSeconds) < 5) {
            throw badRequest(`Question ${number}: time limit must be at least 5 seconds`);
        }

        if (gameType === 'quiz') {
            if (!question.questionText?.trim()) {
                throw badRequest(`Question ${number}: question content is required`);
            }
            if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !option?.trim())) {
                throw badRequest(`Question ${number}: at least two non-empty options are required`);
            }
            if (!Number.isInteger(Number(question.correctIndex)) || Number(question.correctIndex) < 0 || Number(question.correctIndex) >= question.options.length) {
                throw badRequest(`Question ${number}: correct answer is invalid`);
            }
        }

        if (gameType === 'unscramble' && (!question.word?.trim() || question.word.trim().length < 2)) {
            throw badRequest(`Question ${number}: a word of at least two characters is required`);
        }

        if (gameType === 'matching' && (!Array.isArray(question.pairs) || question.pairs.length < 2 || question.pairs.some((pair) => !pair.left?.trim() || !pair.right?.trim()))) {
            throw badRequest(`Question ${number}: at least two non-empty matching pairs are required`);
        }
    });
};

export default {
    createEvent: async (req, res, next) => {
        try {
            const { title, description, coverImage, startDate, endDate, questions, scoringConfig, gameType } = req.body;

            if (!title || !startDate || !endDate) {
                throw badRequest('title, startDate, and endDate are required');
            }
            if (new Date(startDate) >= new Date(endDate)) {
                throw badRequest('startDate must be before endDate');
            }
            if (gameType && !GAME_TYPES.includes(gameType)) {
                throw badRequest('Invalid game type');
            }

            const resolvedGameType = gameType || 'quiz';
            validateQuestions(questions, resolvedGameType);

            const event = await EventModel.create({
                title,
                description,
                coverImage,
                startDate,
                endDate,
                gameType: resolvedGameType,
                questions: buildEventQuestions(questions || [], [], resolvedGameType), // tạo mới hoàn toàn, chưa có existing
                scoringConfig: scoringConfig || undefined,
                createdBy: req.user._id,
            });

            res.status(201).json({ success: true, data: event });
        } catch (err) {
            next(err);
        }
    },

    getAllEventsAdmin: async (req, res, next) => {
        try {
            const events = await EventModel.find().sort({ startDate: -1 });
            res.json({ success: true, data: events });
        } catch (err) {
            next(err);
        }
    },

    getEventByIdAdmin: async (req, res, next) => {
        try {
            const event = await EventModel.findById(req.params.id);
            if (!event) throw notFound('Event not found');
            res.json({ success: true, data: event });
        } catch (err) {
            next(err);
        }
    },

    updateEvent: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { title, description, coverImage, startDate, endDate, questions, scoringConfig } = req.body;
            // Lưu ý: gameType KHÔNG cho đổi sau khi tạo — 1 event chỉ gắn với 1 loại
            // game duy nhất trong suốt vòng đời của nó, tránh vỡ dữ liệu câu hỏi
            // cũ (vd: đổi từ quiz sang matching sẽ làm options/correctIndex vô nghĩa).

            if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
                throw badRequest('startDate must be before endDate');
            }

            const existingEvent = await EventModel.findById(id);
            if (!existingEvent) throw notFound('Event not found');
            if (questions !== undefined) {
                validateQuestions(questions, existingEvent.gameType);
            }

            const event = await EventModel.findByIdAndUpdate(
                id,
                {
                    ...(title !== undefined && { title }),
                    ...(description !== undefined && { description }),
                    ...(coverImage !== undefined && { coverImage }),
                    ...(startDate !== undefined && { startDate }),
                    ...(endDate !== undefined && { endDate }),
                    // Giữ _id ổn định bằng cách so với questions hiện tại trong DB
                    ...(questions !== undefined && {
                        questions: buildEventQuestions(questions, existingEvent.questions, existingEvent.gameType),
                    }),
                    ...(scoringConfig !== undefined && { scoringConfig }),
                },
                { new: true, runValidators: true }
            );

            res.json({ success: true, data: event });
        } catch (err) {
            next(err);
        }
    },

    deleteEvent: async (req, res, next) => {
        try {
            const event = await EventModel.findByIdAndDelete(req.params.id);
            if (!event) throw notFound('Event not found');
            res.json({ success: true, message: 'Event deleted successfully' });
        } catch (err) {
            next(err);
        }
    },
};
