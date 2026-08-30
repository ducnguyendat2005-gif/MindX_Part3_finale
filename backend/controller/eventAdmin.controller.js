import EventModel from '../model/event.js';
import { badRequest, notFound } from '../middleware/appError.middleware.js';
import { buildEventQuestions } from '../src/utils/buildEventQuetions.js';

const GAME_TYPES = ['quiz', 'unscramble', 'matching'];

export default {
    createEvent: async (req, res, next) => {
        try {
            const { title, description, coverImage, startDate, endDate, questions, scoringConfig, gameType } = req.body;

            if (!title || !startDate || !endDate) {
                throw badRequest('Thiếu title/startDate/endDate');
            }
            if (new Date(startDate) >= new Date(endDate)) {
                throw badRequest('startDate phải trước endDate');
            }
            if (gameType && !GAME_TYPES.includes(gameType)) {
                throw badRequest('gameType không hợp lệ');
            }

            const resolvedGameType = gameType || 'quiz';

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
            if (!event) throw notFound('Không tìm thấy sự kiện');
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
                throw badRequest('startDate phải trước endDate');
            }

            const existingEvent = await EventModel.findById(id);
            if (!existingEvent) throw notFound('Không tìm thấy sự kiện');

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
            if (!event) throw notFound('Không tìm thấy sự kiện');
            res.json({ success: true, message: 'Đã xóa sự kiện' });
        } catch (err) {
            next(err);
        }
    },
};