import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true },
}, { timestamps: true });

const EnrollmentModel = mongoose.model('Enrollments', enrollmentSchema);

export default EnrollmentModel;