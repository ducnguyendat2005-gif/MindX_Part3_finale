import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
    accountId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'account',      // trỏ tới model Account (đúng tên bạn đặt trong mongoose.model())
    required: true 
    },
    name: { type: String, required: true },
    title: String,
    bio: String,
    totalStudents: Number,
    totalCourses: Number,
    totalReviews: Number,
    thumbnail: String,
    portfolioUrl: [String],  
});

const InstructorModel = mongoose.model('Instructors', instructorSchema);

export default InstructorModel;