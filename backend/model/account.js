import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    Fname: String,
    Lname: String,
    Username: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    pass: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'teacher'], default: 'user' },

    avatar: { type: String, default: '' },
    description: { type: String, default: '' },
    learningGoal: { type: String, default: '' },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', ''],
        default: '',
    },
    interests: [String],
}, { timestamps: true });

const AccountModel = mongoose.model('account', accountSchema);

export default AccountModel;