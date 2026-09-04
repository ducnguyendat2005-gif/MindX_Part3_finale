import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { checkUserCoupon } from './middleware/coupon.middleware.js'
import { validateReg,validateLogin ,isAdmin, isTeacher, checkDuplicateEmail } from './middleware/account.middleware.js'
import courseController from './controller/course.controller.js';
import commentController from './controller/comment.controller.js';
import accountController from './controller/accounts.controller.js'
import teacherController from './controller/teacher.controller.js'
import friendController from './controller/friend.controller.js'
import messageController from './controller/message.controller.js'
import couponController from './controller/coupon.controller.js';
import orderController from './controller/order.controller.js';
import adminController from './controller/admin.controller.js'
import eventController from './controller/event.controller.js';
import eventAdminController from './controller/eventAdmin.controller.js';
import { isStudent, hasAnyEnrollment } from './middleware/event.middleware.js';
import { uploadPortfolio, uploadCourseMedia } from './src/middleware/upload.middleware.js';
import cors from 'cors'
import { retakeToken } from './middleware/retakeToken.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import cron from 'node-cron';
import { distributeEventRewards } from './src/jobs/eventRewardJob.js';

import dotenv from "dotenv";
import { verifyToken } from './middleware/verifyToken.middleware.js';
dotenv.config();

const app = express();
app.use(cors({ origin:process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
const currentDir = path.dirname(fileURLToPath(import.meta.url));

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, service: 'backend' });
});

console.log(process.env.PORT);
console.log(process.env.MONGO_URI);
console.log('TMN:', JSON.stringify(process.env.VNPAY_TMN_CODE));
console.log('SECRET:', JSON.stringify(process.env.VNPAY_HASH_SECRET));

app.get('/courses',courseController.getAllCourse)

app.get('/top-courses',courseController.getTopCourse)

app.get('/courses/:id',courseController.getCoursebyId)

app.get('/mainComment',commentController.getTopComments)

app.get('/top-teacher',teacherController.getTopTeacher)

app.get('/account/teachers', verifyToken, teacherController.getAllTeachers)
app.get('/account/students', verifyToken, accountController.getAllStudents)
app.get('/account/friends/statuses', verifyToken, friendController.getStatuses)
app.get('/account/friend-requests', verifyToken, friendController.getIncomingRequests)
app.post('/account/friend-requests', verifyToken, friendController.sendRequest)
app.put('/account/friend-requests/:id', verifyToken, friendController.respondToRequest)
app.get('/account/conversations', verifyToken, messageController.getConversations)
app.get('/account/messages/notifications', verifyToken, messageController.getUnreadNotifications)
app.put('/account/messages/notifications/welcome/read', verifyToken, messageController.markWelcomeNotificationRead)
app.get('/account/messages/:userId', verifyToken, messageController.getConversation)
app.post('/account/messages/:userId', verifyToken, messageController.sendMessage)

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

app.get('/account/teaching-courses', verifyToken, isTeacher, accountController.getTeachingCourses)
app.get('/account/teaching-courses/:id', verifyToken, isTeacher, courseController.getTeachingCoursebyId)

app.post(
  '/account/teaching-courses',
  verifyToken,
  isTeacher,
  uploadCourseMedia,
  courseController.createCourse
)

app.put(
  '/account/teaching-courses/:id',
  verifyToken,
  isTeacher,
  uploadCourseMedia,
  courseController.updateCourse
)

app.get('/account/myprofile',verifyToken,accountController.getAllUserInfo)

app.get('/account/myprofile/teacher',verifyToken,teacherController.getAllTeacherInfo)

app.get('/admin',verifyToken,isAdmin,accountController.getAllAdminInfo)
app.put('/admin/accounts/:id/status', verifyToken, isAdmin, accountController.updateAccountStatus)

app.post('/account/checkout',verifyToken,courseController.postCheckout)

app.post('/courses/:id/reviews', verifyToken, courseController.postReview)

app.get('/account/reviews',verifyToken,courseController.getReviews)

app.put('/account/review/:id',verifyToken,courseController.putReviews)

app.delete('/account/review/:id',verifyToken,courseController.deleteReviews)

app.post('/admin/add-coupon', verifyToken, isAdmin, couponController.createCoupon);

app.get('/admin/courses/pending', verifyToken, isAdmin,adminController.getPendingCourses)

app.put('/admin/courses/:id/approve', verifyToken, isAdmin,adminController.approvePendingCourses)

app.put('/admin/courses/:id/reject', verifyToken, isAdmin,adminController.rejectPendingCourses)

app.post('/account/apply-coupon', verifyToken,checkUserCoupon, couponController.applyCoupon);

app.post('/account/momo/create', verifyToken, orderController.createMomoOrder);
app.post(
  '/account/momo/ipn',
  express.json({ type: () => true }),
  orderController.momoIPN
);

app.post('/account/vnpay/create', verifyToken, orderController.createVnpayOrder);
app.get('/account/vnpay/return', orderController.vnpayReturn); // không verifyToken — user redirect từ VNPay về
app.get('/account/vnpay/ipn', orderController.vnpayIPN); // không verifyToken — VNPay gọi trực tiếp, xác thực bằng chữ ký
// app.get('/admin/coupons', verifyToken, isAdmin, couponController.getAllCoupons);
app.get('/account/enrollments/:courseId/progress', verifyToken, courseController.getProgress);
app.put('/account/enrollments/:courseId/progress', verifyToken, courseController.updateProgress);

app.post('/account/enrollments/:courseId/quiz-attempt', verifyToken, courseController.submitQuizAttempt); // THÊM MỚI

app.get('/events', verifyToken, isStudent, eventController.getActiveEvents);
app.get('/events/:eventId', verifyToken, isStudent, eventController.getEventById);
app.post('/events/:eventId/submit-answer', verifyToken, isStudent, hasAnyEnrollment, eventController.submitAnswer);
app.post('/events/:eventId/display-mode', verifyToken, isStudent, hasAnyEnrollment, eventController.setDisplayMode);
app.get('/events/:eventId/leaderboard', verifyToken, isStudent, eventController.getLeaderboard);
app.get('/events/:eventId/my-score', verifyToken, isStudent, eventController.getMyScore);

app.post('/admin/events', verifyToken, isAdmin, eventAdminController.createEvent);
app.get('/admin/events', verifyToken, isAdmin, eventAdminController.getAllEventsAdmin);
app.get('/admin/events/:id', verifyToken, isAdmin, eventAdminController.getEventByIdAdmin);
app.put('/admin/events/:id', verifyToken, isAdmin, eventAdminController.updateEvent);
app.delete('/admin/events/:id', verifyToken, isAdmin, eventAdminController.deleteEvent);

app.post('/account/refresh-token',retakeToken)

// Always return JSON for unknown API routes instead of Express's HTML 404 page.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


app.use(errorHandler);
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/final3")
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err));

cron.schedule('*/1 * * * *', () => {
  // console.log('[cron] tick lúc', new Date().toLocaleTimeString('vi-VN')); // thêm dòng debug này
  distributeEventRewards().catch((err) =>
    console.error('[cron] distributeEventRewards lỗi:', err)
  );
});
app.listen(process.env.PORT, () => {
    console.log('Server is running!');
});
