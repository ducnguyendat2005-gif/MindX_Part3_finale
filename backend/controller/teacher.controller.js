import InstructorModel from "../model/instructor.js";

const teacherController = {
    getTopTeacher: async(req ,res ,next) =>{
        try{
            const data = await InstructorModel.find()
            .sort({ totalReviews: -1 })        // Sắp xếp theo rating giảm dần (Top)

            let sorted = data.slice(0,5)
            res.status(201).send({ data: sorted, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    }
}

export default teacherController