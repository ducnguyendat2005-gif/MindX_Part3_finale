import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    Fname: String,
    Lname: String,
    Username: { type: String, required: true, unique: true },
    Email: { type: String, required: true, unique: true },
    pass: { type: String, required: true }, // nhớ hash bằng bcrypt trước khi lưu
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

const AccountModel = mongoose.model('account', accountSchema);

export default AccountModel;