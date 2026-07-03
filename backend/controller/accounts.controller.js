import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import AccountModel from '../model/account.js';
import EnrollmentModel from '../model/enrollment.js'
import CourseModel from '../model/courses.js'
import InstructorModel from '../model/instructor.js'
import ReviewModel from '../model/review.js'
import CommentModel from '../model/comment.js';
import dotenv from "dotenv";
dotenv.config();

const accountController = {
    registerCustomer: async (req, res, next) => {
        try {
            const { Fname, Lname, Username, Email, pass } = req.body;

            const saltRounds = 10;

            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(pass, salt);

            const createdAccount = await AccountModel.create({ Fname, Lname, Username, Email, pass: hash, role: "user" })
            res.status(201).send({ data: createdAccount, message: 'Register successful!', success: true });
        }
        catch (error) {
            next(error)
        }
    },
    accLogin: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const foundAccount = await AccountModel.findOne({ Email: email }).select("Email role _id")
            const userData = foundAccount.toObject();

            const ATtoken = jwt.sign({ ...userData, type: 'AT' }, process.env.JWT_SECRET_ACCESS, { expiresIn: '1h' });// 👈 thêm type AT
            const RTtoken = jwt.sign({ ...userData, type: 'RT' }, process.env.JWT_SECRET_REFRESH, { expiresIn: '7d' });  // 👈 thêm type RT // ⚠️ '1w' không hợp lệ, phải dùng '7d');

            res.status(200).json({ data: { ATtoken, RTtoken }, message: 'Login successful!', success: true });
        }
        catch (error) {
            next(error)
        }
    },
    getMycourses: async (req, res, next) => {
        try {
        const user = req.user;
        const enrollments = await EnrollmentModel.find({ accountId: user._id }).select("courseId -_id");
        const courseIds = enrollments.map(e => e.courseId);

        const Mycourses = await CourseModel.aggregate([
            { $match: { _id: { $in: courseIds } } },
            {
                $lookup: {
                    from: "instructors",
                    localField: "instructorId",
                    foreignField: "_id",
                    as: "instructor"
                }
            },
            { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "courseId",
                    as: "reviewList"
                }
            },
            {
                $addFields: {
                    author: "$instructor.name",
                    reviews: { $size: "$reviewList" }
                }
            },
            { $project: { reviewList: 0 } }
        ]);

        res.status(200).json({ data: Mycourses, message: 'Retrieve successful!', success: true });
        }
        catch (error) {
            next(error)
        }
    },
    getAllUserInfo: async (req, res, next) => {
        try {
            const user = req.user;
            const AllUserInfo = await AccountModel.findById(user._id).select("-pass")
            const findCourses = await EnrollmentModel.find({ accountId: user._id }).populate('courseId');

            res.status(200).json({ user: AllUserInfo, courses: findCourses, message: 'Retrieve successful!', success: true });
        }
        catch (error) {
            next(error)
        }
    },
    getAllAdminInfo: async (req, res, next) => {
        try {
            const AccountInf = await AccountModel.find()
            const CommentInf = await CommentModel.find()
            const CourseInf = await CourseModel.find()
            const EnrollmentInf = await EnrollmentModel.find()
            const InstructorInf = await InstructorModel.find()
            const ReviewInf = await ReviewModel.find()
            res.status(200).json({ 
                user: AccountInf,
                comment: CommentInf, 
                course: CourseInf, 
                enroll: EnrollmentInf,
                instructor:InstructorInf,
                review:ReviewInf,
                message: 'Retrieve successful!', 
                success: true });
        }
        catch (error) {
            next(error)
        }
    }
}

export default accountController