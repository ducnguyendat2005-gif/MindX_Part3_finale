import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }], // lưu lessonDetails._id
    lastAccessedLessonId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

enrollmentSchema.index({ accountId: 1, courseId: 1 }, { unique: true });

const EnrollmentModel = mongoose.model('Enrollments', enrollmentSchema);
export default EnrollmentModel;