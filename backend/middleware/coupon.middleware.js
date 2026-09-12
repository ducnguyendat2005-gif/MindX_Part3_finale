import CouponModel from "../model/coupon.js";

export const checkUserCoupon = async (req, res, next) => {
    try {
        const code = String(req.body?.code || '').trim().toUpperCase();
        if (!code) {
            const err = new Error('Coupon code is required');
            err.status = 400;
            throw err;
        }

        const coupon = await CouponModel.findOne({ code })
            .select('maxUses usedCount isActive expiresAt -_id')
            .lean();

        if (!coupon) {
            const err = new Error('Code not existed, try another');
            err.status = 400;
            throw err;
        }

        if (coupon.isActive === false) {
            const err = new Error('Code has been deactivated by backend');
            err.status = 400;
            throw err;
        }

        const now = new Date();
        if (coupon.expiresAt && coupon.expiresAt <= now) {
            const err = new Error('Code expired!');
            err.status = 400;
            throw err;
        }

        const usedCount = Number(coupon.usedCount) || 0;
        if (coupon.maxUses != null && usedCount >= Number(coupon.maxUses)) {
            const err = new Error('There is no code left');
            err.status = 400;
            throw err;
        }

        // Dùng cùng mã đã chuẩn hoá ở controller và bước tạo order.
        req.body.code = code;
        next();
    } catch (error) {
        next(error);
    }
};
