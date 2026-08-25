import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import AccountModel from '../model/account.js';
import EnrollmentModel from '../model/enrollment.js'
import CourseModel from '../model/courses.js'
import InstructorModel from '../model/instructor.js'
import ReviewModel from '../model/review.js'
import CommentModel from '../model/comment.js';
import { uploadAvatar } from '../src/middleware/upload.middleware.js';
import { runMiddleware } from '../src/utils/runMiddleware.js';
import { uploadBufferToCloudinary } from '../src/utils/uploadToCloudinary.js';
import dotenv from "dotenv";
dotenv.config();

const accountController = {
    registerCustomer: async (req, res, next) => {
        try {
            const { Fname, Lname, Username, Email, pass,interests,level,learningGoal } = req.body;

            const saltRounds = 10;

            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(pass, salt);

            const createdAccount = await AccountModel.create({ 
                Fname, 
                Lname,
                Username,
                Email, 
                pass: hash, 
                role: "user",
                interests,
                level,
                learningGoal,
             })
            res.status(201).send({ data: createdAccount, message: 'Register successful!', success: true });
        }
        catch (error) {
            next(error)
        }
    },
    accLogin: async (req, res, next) => {
        try {
            // Login accepts either the account username or email.
            // `email` remains a fallback for clients using the old request shape.
            const { identifier, email, password } = req.body;
            const loginIdentifier = (identifier ?? email)?.trim();

            const foundAccount = await AccountModel.findOne({
                $or: [{ Email: loginIdentifier }, { Username: loginIdentifier }],
            }).select("Email role _id Username Fname Lname avatar")
            if (!foundAccount) {
                const error = new Error("Account not found");
                error.status = 401;
                throw error;
            }
            const userData = foundAccount.toObject();
            

            const ATtoken = jwt.sign({ ...userData, type: 'AT' }, process.env.JWT_SECRET_ACCESS, { expiresIn: '1d' });// 👈 thêm type AT
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
    getTeachingCourses: async (req, res, next) => {
        try {
            const instructor = await InstructorModel.findOne({ accountId: req.user._id });
            if (!instructor) {
                return res.status(200).json({ data: [], message: 'No instructor profile', success: true });
            }

            const courseFilter = { instructorId: instructor._id };
            if (['draft', 'published'].includes(req.query.status)) {
                courseFilter.status = req.query.status;
            }

            const courses = await CourseModel.find(courseFilter)
                .populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail')
                .sort({ createdAt: -1 });

            res.status(200).json({ data: courses, message: 'Retrieve successful!', success: true });
        } catch (error) {
            next(error);
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
            const AccountInf = (await AccountModel.find()).filter((account) =>
                String(account.Username || '').replace(/^@/, '').toLowerCase() !== 'hoado'
            )
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
    },
    updateAccountStatus: async (req, res, next) => {
        try {
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ success: false, message: 'Trạng thái tài khoản không hợp lệ' });
            }

            const account = await AccountModel.findById(req.params.id);
            if (!account) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
            }

            const normalizedUsername = String(account.Username || '').replace(/^@/, '').toLowerCase();
            if (normalizedUsername === 'hoado') {
                return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản quản trị' });
            }

            account.isActive = isActive;
            await account.save();
            res.status(200).json({ success: true, data: account, message: 'Cập nhật trạng thái thành công' });
        } catch (error) {
            next(error);
        }
    },
    teacherRegister:async (req, res,next) =>{
        let createdAccount
        try{
            const {
                Fname,
                Lname,
                Username,
                Email,
                pass,
                expertise,
                experienceYears,
                bio,
                } = req.body;
            const DEFAULT_THUMBNAIL = "https://res.cloudinary.com/demo/image/upload/default-avatar.png"; // ← đặt link ảnh mặc định của bạn ở đây

            let portfolioUrl = [];
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file =>
                    uploadBufferToCloudinary(file.buffer, file.mimetype)
                );
                const results = await Promise.all(uploadPromises);
                portfolioUrl = results.map(r => r.secure_url);
            }

            const saltRounds = 10;

            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(pass, salt);

            createdAccount = await AccountModel.create({ Fname, Lname, Username, Email, pass: hash, role :"teacher" })
            const createInstructor = await InstructorModel.create({
                name :Username,
                title:expertise,
                thumbnail:DEFAULT_THUMBNAIL,
                bio:bio,
                yearsOfExperience: Number(experienceYears) || 0, 
                portfolioUrl: portfolioUrl,  
                totalStudents : 0,
                totalCourses : 0,
                totalReviews : 0,
                rating : 0,
                accountId:createdAccount._id})
            res.status(201).send({ data: createInstructor, message: 'Register successful!', success: true });
        }
        catch (error){
        if (createdAccount?._id) {
            await AccountModel.findByIdAndDelete(createdAccount._id).catch(() => {});
        }
            next(error)
        }
    },
    updateProfile:async (req,res,next) =>{
        try {
            await runMiddleware(req, res, uploadAvatar);

            const accountId = req.user._id;
            const { Fname, Lname, description, learningGoal, level, interests } = req.body;

            let avatar;
            if (req.file) {
                const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype);
                avatar = result.secure_url;
            }

            const updateData = { Fname, Lname, description, learningGoal, level, interests };
            if (avatar) updateData.avatar = avatar; // chỉ set khi có ảnh mới, tránh đè avatar cũ thành undefined

            const updated = await AccountModel.findByIdAndUpdate(
                accountId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
            }
            res.status(200).json({ success: true, data: updated, message: 'Cập nhật thành công' });
        } catch (error) {
            next(error);
        }
    },
    changePassword:async (req,res,next) =>{
        try{
            const user = req.user;
            const { oldPassword, newPassword } = req.body;
            const prePass = (await AccountModel.findById(user._id).select('pass -_id').lean())?.pass

            const isOldMatch = await bcrypt.compare(oldPassword, prePass);
            if (!isOldMatch) throw new Error ("email hoac password cu sai")

            const saltRounds = 10;
            
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(newPassword, salt);

            const updated = await AccountModel.findByIdAndUpdate(
                user._id,
                {pass:hash},
                { new: true, runValidators: true }
            )
            console.log(prePass);
            res.status(200).json({ success: true, data: updated, message: 'Cập nhật thành công' });
        }
        catch(error){
            next(error)
        }
    }
}

export default accountController
