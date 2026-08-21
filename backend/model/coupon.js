import mongoose from 'mongoose';
// model/coupon.js
const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'number'], required: true },
    discountValue: { type: Number, required: true },
    maxUses: { type: Number, default: null },   // null = không giới hạn
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CouponModel = mongoose.model('Coupons', couponSchema);
export default CouponModel;