import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { validateReg,validateLogin ,isAdmin} from './middleware/account.middleware.js'
import courseController from './controller/course.controller.js';
import commentController from './controller/comment.controller.js';
import accountController from './controller/accounts.controller.js'
import teacherController from './controller/teacher.controller.js'
import cors from 'cors'
import { retakeToken } from './middleware/retakeToken.middleware.js';

import dotenv from "dotenv";
import { verifyToken } from './middleware/verifyToken.middleware.js';
dotenv.config();

const app = express();
app.use(cors({ origin:'http://localhost:5173', credentials: true }));
app.use(express.json());

console.log(process.env.PORT);
console.log(process.env.MONGO_URI);

app.get('/courses',courseController.getAllCourse)

app.get('/top-courses',courseController.getTopCourse)

app.get('/courses/:id',courseController.getCoursebyId)

app.get('/mainComment',commentController.getTopComments)

app.get('/top-teacher',teacherController.getTopTeacher)

app.post('/register',validateReg,accountController.registerCustomer)

app.post('/login',validateLogin,accountController.accLogin)

app.get('/account/mycourses',verifyToken,accountController.getMycourses)

app.get('/account/myprofile',verifyToken,accountController.getAllUserInfo)

app.get('/admin',verifyToken,isAdmin,accountController.getAllAdminInfo)

app.post('/account/checkout',verifyToken,courseController.postCheckout)

app.post('/courses/:id/reviews', verifyToken, courseController.postReview)

app.post('/account/refresh-token',retakeToken)



app.use(errorHandler);
mongoose.connect("mongodb://localhost:27017/final3")
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err));

app.listen(process.env.PORT, () => {
    console.log('Server is running!');
});