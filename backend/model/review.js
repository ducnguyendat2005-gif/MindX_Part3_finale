import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true }, // nhớ khớp đúng tên model
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts', required: true },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
}, { timestamps: true });

reviewSchema.index({ courseId: 1, accountId: 1 }, { unique: true });

const ReviewModel = mongoose.model('Reviews', reviewSchema);

export default ReviewModel;