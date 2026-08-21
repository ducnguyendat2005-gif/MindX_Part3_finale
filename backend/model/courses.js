import mongoose from 'mongoose';

const syllabusSectionSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    // Kept for compatibility with the existing course detail screens.
    lessons: { type: Number, default: 0 },
    duration: { type: String, default: '0 min' },
    items: { type: [String], default: [] },
    lessonDetails: [{
        title: { type: String, required: true, trim: true },
        duration: { type: String, default: '0 min' },
        videoUrl: { type: String, default: '' },
    }],
}, { _id: false });

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructors', required: true },
    rating: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    lectures: { type: Number, default: 0 },
    level: String,
    price: { type: Number, min: 0, default: 0 },
    promotionalPrice: Number,
    discount: String,
    category: String,
    thumbnail: String,
    promotionalVideo: String,
    shortDescription: String,
    courseDescription: String,
    objectives: { type: [String], default: [] },
    certification: String,
    languages: [String],
    syllabus: [syllabusSectionSchema],
    status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected'],
        default: 'draft',
    },
    rejectionReason: { type: String, default: '' },
    publishedAt: Date,
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
