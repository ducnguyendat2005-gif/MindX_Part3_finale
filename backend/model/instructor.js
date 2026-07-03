import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: String,
    bio: String,
    totalStudents: Number,
    totalCourses: Number,
    totalReviews: Number,
    thumbnail: String,
});

const InstructorModel = mongoose.model('Instructors', instructorSchema);

export default InstructorModel;