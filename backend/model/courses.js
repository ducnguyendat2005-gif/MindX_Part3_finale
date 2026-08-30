import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    duration: { type: String, default: '0 min' },
    videoUrl: { type: String, default: '' },
});
// THÊM MỚI — đặt trước syllabusSectionSchema
const quizQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true, trim: true },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: (arr) => arr.length === 4,
            message: 'Each quetion must have 4 options',
        },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema({
    title: { type: String, default: 'Kiểm tra nhanh' },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    questions: { type: [quizQuestionSchema], default: [] },
});

const syllabusSectionSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    lessons: { type: Number, default: 0 },
    duration: { type: String, default: '0 min' },
    items: { type: [String], default: [] },
    lessonDetails: [lessonSchema],
    quiz: { type: quizSchema, default: null }
},);

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructors', required: true },
    rating: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    lectures: { type: Number, default: 0 },
    level: String,
    price: { type: Number, min: 0, default: 0 },
    promotionalPrice:Number,
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
