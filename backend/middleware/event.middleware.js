import EnrollmentModel from '../model/enrollment.js';
import { forbidden } from './appError.middleware.js';

// Chỉ role 'user' (student) được tham gia event
export const isStudent = (req, res, next) => {
    if (req.user.role !== 'user') {
        return next(forbidden('Only students can join events'));
    }
    next();
};

// Đọc-only: kiểm tra đã mua ít nhất 1 khóa học chưa, KHÔNG sửa gì EnrollmentModel
export const hasAnyEnrollment = async (req, res, next) => {
    try {
        const enrolled = await EnrollmentModel.exists({ accountId: req.user._id });
        if (!enrolled) {
            return next(forbidden('You need to purchase at least one course to join an event'));
        }
        next();
    } catch (err) {
        next(err);
    }
};