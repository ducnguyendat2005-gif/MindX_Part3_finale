import CourseModel from '../model/courses.js';
import EnrollmentModel from '../model/enrollment.js';
import ReviewModel from '../model/review.js';
import AccountModel from '../model/account.js';

const courseController = {
    getAllCourse: async(req ,res ,next) =>{
        try{
            const data = await CourseModel.find().populate('instructorId', 'name title').populate('reviews')
            res.status(201).send({ data: data, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    },
    getTopCourse: async(req,res,next) =>{
        try{
            const data = await CourseModel.find().populate('instructorId', 'name title').populate('reviews').sort({ rating: -1 }).limit(4);
            res.status(201).send({ data: data, message: 'data retrieve successful!', success: true });}
        catch(error){
            next(error)
        }
    },
    getCoursebyId :async (req, res, next) =>{
        try {
            const { id } = req.params;
            
            const Mycourse = await CourseModel.findById(id)
                .populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail')
                .populate('reviews');
            res.status(201).send({ data: Mycourse, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    },
    postCheckout :async (req,res,next) =>{
        try{
        const data = req.body;
        const user = req.user;

        const ops = data.courses.map(courseId => ({
            updateOne: {
                filter: { accountId: user._id, courseId },
                update: { $setOnInsert: { accountId: user._id, courseId } },
                upsert: true
            }
        }));
        console.log(JSON.stringify(ops, null, 1));
        await EnrollmentModel.bulkWrite(ops);

        res.json({ message: "Checkout successful" });
        }
        catch(error){
            next(error)
        }
    },
    postReview:async (req,res,next) =>{
        try{
            const { id: courseId } = req.params;
            const { rating, comment } = req.body;
            const accountId = req.user._id; // lấy từ JWT middleware

            // (optional) kiểm tra user đã enroll course này chưa mới cho review
            
            const enrolled = await EnrollmentModel.findOne({ accountId, courseId });
            if (!enrolled) return res.status(403).json({ message: 'Bạn cần mua khóa học trước khi review', success: false });

            const account = await AccountModel.findById(accountId);
            const displayName = `${account.Fname} ${account.Lname}`.trim() || account.Username;

            const review = await ReviewModel.create({ courseId, accountId, name: displayName, rating, comment });
            res.status(201).json({ data: review, message: 'Review created', success: true });
        }
        catch(error){
            next(error)
        }
    }
}
export default courseController