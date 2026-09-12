import AccountModel from '../model/account.js';
import CommentModel from '../model/comment.js';
import CouponModel from '../model/coupon.js';
import CourseModel from '../model/courses.js';
import EnrollmentModel from '../model/enrollment.js';
import InstructorModel from '../model/instructor.js';
import OrderModel from '../model/order.js';
import ReviewModel from '../model/review.js';
import NotificationModel from '../model/notification.js';

const notifyCourseInstructor = async (course, type, title, message) => {
    const instructor = await InstructorModel.findById(course.instructorId).select('accountId');
    if (!instructor?.accountId) return;

    await NotificationModel.create({
        accountId: instructor.accountId,
        type,
        title,
        message,
        meta: { courseId: course._id },
    });
};

const adminController = {
    getPendingCourses: async(req ,res ,next) =>{
        try{
            const data = await CourseModel.find({status:"pending"}).populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail');
            res.status(201).send({ data: data, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    },
    approvePendingCourses: async(req,res,next) => {
        try {
            const {id} = req.params;
            const updated = await CourseModel.findOneAndUpdate(
                { _id: id, status: 'pending' },
                { $set: { status: 'approved', publishedAt: new Date() } },
                { new: true, runValidators: true },
            );
            if (!updated) {
                return res.status(404).json({ message: 'Pending course not found', success: false });
            }
            await InstructorModel.findByIdAndUpdate(updated.instructorId, { $inc: { totalCourses: 1 } });
            res.status(201).send({ data: updated, message: 'data updated successful!', success: true });
        }
        catch (error){
            next(error)
        }
    },
    rejectPendingCourses: async(req,res,next) => {
        try {
            const {id} = req.params;
            const reason = String(req.body.reason || '').trim();
            if (!reason) {
                return res.status(400).json({ message: 'Please give a reason why you reject this course', success: false });
            }
            const course = await CourseModel.findOne({ _id: id, status: 'pending' });
            if (!course) {
                return res.status(404).json({ message: 'Pending course not found', success: false });
            }

            course.status = 'rejected';
            course.rejectionReason = reason;
            await course.save();
            await notifyCourseInstructor(
                course,
                'course_rejected',
                'Course submission rejected',
                `Your course "${course.title}" was rejected by an admin. Reason: ${reason}`,
            );

            res.status(201).send({ data: course, message: reason, success: true });
        }
        catch (error){
            next(error)
        }
    },
    hideApprovedCourse: async(req,res,next) => {
        try {
            const { id } = req.params;
            const reason = String(req.body.reason || '').trim();
            if (!reason) {
                return res.status(400).json({ message: 'Please give a reason why you hide this course', success: false });
            }

            const course = await CourseModel.findOne({ _id: id, status: 'approved' });
            if (!course) {
                return res.status(404).json({ message: 'Approved course not found', success: false });
            }

            course.status = 'hidden';
            course.hiddenReason = reason;
            course.hiddenAt = new Date();
            await course.save();
            await notifyCourseInstructor(
                course,
                'course_hidden',
                'Course hidden by admin',
                `Your approved course "${course.title}" was hidden by an admin. Reason: ${reason}`,
            );

            res.status(200).json({ data: course, message: 'Course hidden successfully', success: true });
        }
        catch (error){
            next(error)
        }
    },
    unhideCourse: async(req,res,next) => {
        try {
            const { id } = req.params;
            const course = await CourseModel.findOne({ _id: id, status: 'hidden' });
            if (!course) {
                return res.status(404).json({ message: 'Hidden course not found', success: false });
            }

            course.status = 'approved';
            course.hiddenReason = '';
            course.hiddenAt = undefined;
            await course.save();
            await notifyCourseInstructor(
                course,
                'course_unhidden',
                'Course visible again',
                `Your course "${course.title}" was made visible again by an admin and is now available in the course list.`,
            );

            res.status(200).json({ data: course, message: 'Course is visible again', success: true });
        }
        catch (error){
            next(error)
        }
    }
}
export default adminController
