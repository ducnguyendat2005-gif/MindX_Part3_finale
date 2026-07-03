import CommentModel from "../model/comment.js";

const commentController = {
    getTopComments: async(req ,res ,next) =>{
        try{
            const data = await CommentModel.find()
            res.status(201).send({ data: data, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    }
}
export default commentController