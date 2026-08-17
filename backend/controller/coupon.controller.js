import CouponModel from '../model/coupon.js'
import CourseModel from '../model/courses.js'

const couponController = {
    createCoupon: async (req, res, next) => {
        try {
            const {
                code,
                discountType,
                discountValue,
                maxUses,
                usedCount,
                expiresAt,
                isActive } = req.body

            const checkDup = await CouponModel.findOne({ code: code })
            if (checkDup) throw new Error("Code Duplicated")

            const postedCoupon = await CouponModel.create({
                code: code,
                discountValue: discountValue,
                discountType: discountType,
                maxUses: maxUses,
                usedCount: usedCount,
                expiresAt: expiresAt,
                isActive: isActive
            });

            res.status(200).json({ data: postedCoupon, message: 'Coupon created', success: true })
        }
        catch (error) {
            next(error)
        }
    },

    applyCoupon: async (req, res, next) => {
        try {
            const { code, courseIds } = req.body; // courseIds: mảng id các course trong giỏ

            if (!Array.isArray(courseIds) || courseIds.length === 0) {
                const err = new Error("Empty cart");
                err.statusCode = 400;
                throw err;
            }

            const coup = await CouponModel.findOne({ code: code })
                .select("discountType discountValue maxUses -_id")

            if (!coup) {
                const err = new Error("Code not existed, try another");
                err.statusCode = 400;
                throw err;
            }

            const courses = await CourseModel.find({ _id: { $in: courseIds } }).select('price')
            const subtotal = courses.reduce((sum, c) => sum + c.price, 0);

            let discountAmount;
            if (coup.discountType === 'number') {
                discountAmount = Math.min(coup.discountValue, subtotal); // không giảm quá subtotal
            } else {
                const safePercent = Math.min(Math.max(coup.discountValue, 0), 100);
                discountAmount = Number((subtotal * safePercent / 100).toFixed(2));
            }

            const total = Math.max(subtotal - discountAmount, 0);

            res.status(200).json({
                data: { subtotal, discountAmount, total },
                message: 'Coupon applied',
                success: true
            })
        }
        catch (error) {
            next(error)
        }
    }
}

export default couponController