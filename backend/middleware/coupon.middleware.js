import CouponModel from "../model/coupon.js";
import CourseModel from "../model/courses.js";

export const checkUserCoupon = async (req,res,next) => {
    try {
        const {code,courseId} = req.body;

        const courseCode = await CouponModel.findOne({ code: code })
            .select("applicableCourses maxUses isActive expiresAt -_id") // chỉ giữ applicableCourses, ẩn cả _id
    

        if (!courseCode) throw new Error ("Code not existed, try another")

        
        const now = new Date();
        if (courseCode.expiresAt && courseCode.expiresAt < now) {
            const err = new Error("Code expired!");
            err.statusCode = 400;
            throw err;
        }
        if (courseCode.maxUses === 0) throw new Error ("There is no code left")

        if (courseCode.isActive === false) throw new Error ("Code has been deactivated by backend")
        next()
    }
    catch(error){
        next(error)
    }
}