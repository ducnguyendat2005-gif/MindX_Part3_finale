import mongoose from 'mongoose';

const syllabusSectionSchema = new mongoose.Schema({
    title: String,
    lessons: Number,
    duration: String,
    items: [String],
}, { _id: false });

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructors', required: true },
    rating: Number,
    hours: Number,
    lectures: Number,
    level: String,
    price: Number,
    promotionalPrice: Number,
    discount: String,
    category: String,
    thumbnail: String,
    shortDescription: String,
    courseDescription: String,
    certification: String,
    languages: [String],
    syllabus: [syllabusSectionSchema],
}, { timestamps: true });

// courseModel.js
courseSchema.virtual('reviews', {
    ref: 'Reviews',
    localField: '_id',
    foreignField: 'courseId'
});

courseSchema.set('toObject', { virtuals: true });
courseSchema.set('toJSON', { virtuals: true });

const CourseModel = mongoose.model('Courses', courseSchema);

export default CourseModel;