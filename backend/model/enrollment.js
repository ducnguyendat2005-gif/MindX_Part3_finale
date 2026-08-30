import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true }, // % đúng
    passed: { type: Boolean, required: true },
    answers: [{ type: Number }], // index đáp án đã chọn, theo đúng thứ tự questions
    attemptedAt: { type: Date, default: Date.now },
}, { _id: false });


const enrollmentSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }], // lưu lessonDetails._id
    lastAccessedLessonId: mongoose.Schema.Types.ObjectId,
    quizAttempts: { type: [quizAttemptSchema], default: [] },
}, { timestamps: true });

enrollmentSchema.index({ accountId: 1, courseId: 1 }, { unique: true });

const EnrollmentModel = mongoose.model('Enrollments', enrollmentSchema);
export default EnrollmentModel;