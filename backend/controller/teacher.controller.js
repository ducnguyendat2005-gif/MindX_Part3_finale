import InstructorModel from "../model/instructor.js";
import AccountModel from "../model/account.js";
import CourseModel from "../model/courses.js";
import ReviewModel from "../model/review.js";

const teacherController = {
    getTopTeacher: async(req ,res ,next) =>{
        try{
            const data = await InstructorModel.find()
            .sort({ totalReviews: -1 })        // Sắp xếp theo rating giảm dần (Top)

            let sorted = data.slice(0,5)
            res.status(201).send({ data: sorted, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    },
    updateInstructorProfile : async(req,res,next) =>{
        try {
            if (req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: 'Chỉ giáo viên mới được sửa mục này' });
            }

            const { title, bio, yearsOfExperience } = req.body; // whitelist, không cho sửa totalStudents/rating tự tính

            const updated = await InstructorModel.findOneAndUpdate(
            { accountId: req.user._id }, // filter theo accountId từ JWT, không tin req.params
            { $set: { title, bio, yearsOfExperience } },
            { new: true, runValidators: true }
            );

            if (!updated) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên' });
            }

            res.status(200).json({ success: true, data: updated, message: 'Cập nhật hồ sơ giảng viên thành công' });
        } catch (error) {
            next(error);
        }
    },
    getAllTeacherInfo: async (req, res, next) => {
        try {
            const user = req.user;

            const AllUserInfo = await AccountModel.findById(user._id).select("-pass");

            const instructorInfo = await InstructorModel.findOne({ accountId: user._id });

            const myCourses = instructorInfo
                ? await CourseModel.find({ instructorId: instructorInfo._id })
                : [];

            const myCourseIds = myCourses.map(c => c._id);
            const myReview = await ReviewModel.find({ courseId: { $in: myCourseIds } });

            res.status(200).json({
                user: AllUserInfo,
                instructor: instructorInfo,
                courses: myCourses,
                reviews: myReview,
                message: 'Retrieve successful!',
                success: true
            });
        }
        catch (error) {
            next(error);
        }
    }
}

export default teacherController