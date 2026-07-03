import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    name: String,
    role: String,
    avatar: String,
});

const CommentModel = mongoose.model('Comments', commentSchema);

export default CommentModel;