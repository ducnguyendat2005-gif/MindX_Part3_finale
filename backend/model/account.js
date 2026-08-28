import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    Fname: String,
    Lname: String,
    Username: { type: String, required: true, unique: true, trim: true },
    Email: { type: String, required: true, unique: true },
    pass: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'teacher'], default: 'user' },
    isActive: { type: Boolean, default: true },
    avatar: { 
    type: String, 
    default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
    },
    description: { type: String, default: '' },
    learningGoal: { type: String, default: '' },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', ''],
        default: '',
    },
    interests: [String],
    welcomeNotificationRead: { type: Boolean, default: true },
}, { timestamps: true });

const AccountModel = mongoose.model('account', accountSchema);

export default AccountModel;
