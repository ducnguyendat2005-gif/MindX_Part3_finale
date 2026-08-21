import AccountModel from '../model/account.js';
import CommentModel from '../model/comment.js';
import CouponModel from '../model/coupon.js';
import CourseModel from '../model/courses.js';
import EnrollmentModel from '../model/enrollment.js';
import InstructorModel from '../model/instructor.js';
import OrderModel from '../model/order.js';
import ReviewModel from '../model/review.js';

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
            const updated = await CourseModel.findByIdAndUpdate(id, { status: "approved" }, { new: true, runValidators: true })
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
            const updated = await CourseModel.findByIdAndUpdate(id, { status: "rejected" ,rejectionReason:reason}, { new: true, runValidators: true })
            res.status(201).send({ data: updated, message: reason, success: true });
        }
        catch (error){
            next(error)
        }
    }
}
export default adminController