import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
    accountId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'account',
        required: true 
    },
    name: { type: String, required: true },
    title: String,
    bio: String,
    thumbnail: { 
        type: String, 
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
    },

    yearsOfExperience: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    // Portfolio không bắt buộc khi đăng ký; giáo viên có thể bổ sung sau.
    portfolioUrl: { type: [String], default: [] },
});

const InstructorModel = mongoose.model('Instructors', instructorSchema);

export default InstructorModel;
