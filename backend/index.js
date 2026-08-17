import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { validateReg,validateLogin ,isAdmin ,checkDuplicateEmail } from './middleware/account.middleware.js'
import { checkUserCoupon } from './middleware/coupon.middleware.js'
import courseController from './controller/course.controller.js';
import commentController from './controller/comment.controller.js';
import accountController from './controller/accounts.controller.js'
import teacherController from './controller/teacher.controller.js'
import couponController from './controller/coupon.controller.js';
import orderController from './controller/order.controller.js';
import { uploadPortfolio } from './src/middleware/upload.middleware.js';
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

app.post(
  '/register/teacher',
  uploadPortfolio,   // ← thêm dòng này, đứng TRƯỚC validateReg
  validateReg,
  accountController.teacherRegister
);

app.post('/register',validateReg,accountController.registerCustomer)
// index.js
app.put('/account/update-account', verifyToken, accountController.updateProfile)     
// index.js
app.put('/account/change-password', verifyToken, accountController.changePassword);

app.put('/account/update-instructor', verifyToken, teacherController.updateInstructorProfile) 

app.post('/account/check-duplicate',checkDuplicateEmail)

app.post('/login',validateLogin,accountController.accLogin)

app.get('/account/mycourses',verifyToken,accountController.getMycourses)

app.get('/account/myprofile',verifyToken,accountController.getAllUserInfo)

app.get('/account/myprofile/teacher',verifyToken,teacherController.getAllTeacherInfo)

app.get('/admin',verifyToken,isAdmin,accountController.getAllAdminInfo)

app.post('/account/checkout',verifyToken,courseController.postCheckout)

app.post('/courses/:id/reviews', verifyToken, courseController.postReview)

app.get('/account/reviews',verifyToken,courseController.getReviews)

app.put('/account/review/:id',verifyToken,courseController.putReviews)

app.delete('/account/review/:id',verifyToken,courseController.deleteReviews)

app.post('/admin/add-coupon', verifyToken, isAdmin, couponController.createCoupon);

app.post('/account/apply-coupon', verifyToken,checkUserCoupon, couponController.applyCoupon);

app.post('/account/momo/create', verifyToken, orderController.createMomoOrder);
app.post('/account/momo/ipn', orderController.momoIPN); // không verifyToken — MoMo gọi trực tiếp, xác thực bằng chữ ký

app.post('/account/vnpay/create', verifyToken, orderController.createVnpayOrder);
app.get('/account/vnpay/return', orderController.vnpayReturn); // không verifyToken — user redirect từ VNPay về

// app.get('/admin/coupons', verifyToken, isAdmin, couponController.getAllCoupons);

app.post('/account/refresh-token',retakeToken)



app.use(errorHandler);
mongoose.connect("mongodb://localhost:27017/final3")
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err));

app.listen(process.env.PORT, () => {
    console.log('Server is running!');
});