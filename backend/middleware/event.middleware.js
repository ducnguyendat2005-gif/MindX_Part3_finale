import EnrollmentModel from '../model/enrollment.js';
import { forbidden } from './appError.middleware.js';

// Chỉ role 'user' (student) được tham gia event
export const isStudent = (req, res, next) => {
    if (req.user.role !== 'user') {
        return next(forbidden('Chỉ học viên mới được tham gia sự kiện'));
    }
    next();
};

// Đọc-only: kiểm tra đã mua ít nhất 1 khóa học chưa, KHÔNG sửa gì EnrollmentModel
export const hasAnyEnrollment = async (req, res, next) => {
    try {
        const enrolled = await EnrollmentModel.exists({ accountId: req.user._id });
        if (!enrolled) {
            return next(forbidden('Bạn cần mua ít nhất 1 khóa học để tham gia sự kiện'));
        }
        next();
    } catch (err) {
        next(err);
    }
};