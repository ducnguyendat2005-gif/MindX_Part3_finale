import CourseModel from '../model/courses.js';
import EnrollmentModel from '../model/enrollment.js';
import ReviewModel from '../model/review.js';
import AccountModel from '../model/account.js';
import InstructorModel from '../model/instructor.js';
import { uploadBufferToCloudinary } from '../src/utils/uploadToCloudinary.js';

const parseJsonField = (value, fallback) => {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const uploadFileToCloudinary = async (file, folder = 'byway/courses') => {
    if (!file) return '';
    console.log('DEBUG upload file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer?.length,
    });
    const result = await uploadBufferToCloudinary(file.buffer, file.mimetype, folder);
    return result.secure_url;
};

const durationToMinutes = (value) => {
    const minutes = Number.parseInt(String(value || ''), 10);
    return Number.isFinite(minutes) && minutes >= 0 ? minutes : 0;
};

const formatDuration = (minutes) => `${minutes} min`;
const publicCourseFilter = {
    status: 'approved',
};

const courseController = {
    createCourse: async (req, res, next) => {
        try {
            const data = parseJsonField(req.body.data, {});
            const title = String(data.title || '').trim();
            const status = data.status === 'published' ? 'pending' : 'draft';            const price = Number(data.price ?? 0);
            const curriculum = Array.isArray(data.curriculum) ? data.curriculum : [];

            if (!title) {
                return res.status(400).json({ message: 'Tên khóa học là bắt buộc', success: false });
            }
            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({ message: 'Giá khóa học không hợp lệ', success: false });
            }

            const instructor = await InstructorModel.findOne({ accountId: req.user._id });
            if (!instructor) {
                return res.status(400).json({ message: 'Tài khoản chưa có hồ sơ giáo viên', success: false });
            }

            if (status === 'pending') {
                if (!String(data.overview || '').trim()) {
                    return res.status(400).json({ message: 'Vui lòng nhập phần giới thiệu khóa học', success: false });
                }
                if (!curriculum.length || curriculum.some((section) => (
                    !String(section.title || '').trim() ||
                    !Array.isArray(section.lessons) ||
                    !section.lessons.length ||
                    section.lessons.some((lesson) => !String(lesson.title || '').trim())
                ))) {
                    return res.status(400).json({ message: 'Mỗi phần phải có tên và ít nhất một bài học có tên', success: false });
                }
            }
            if (data.promotionalPrice !== undefined && data.promotionalPrice !== null) {
                const promoPrice = Number(data.promotionalPrice);
                if (!Number.isFinite(promoPrice) || promoPrice < 0 || promoPrice >= price) {
                    return res.status(400).json({ message: 'Giá khuyến mãi không hợp lệ', success: false });
                }
            }

            const parsedLessonVideoIndexes = parseJsonField(req.body.lessonVideoIndexes, []);
            const lessonVideoIndexes = Array.isArray(parsedLessonVideoIndexes)
                ? parsedLessonVideoIndexes
                : [];
            const lessonFiles = req.files?.lessonVideos || [];

            const [thumbnail, promotionalVideo, lessonVideoUrls] = await Promise.all([
                uploadFileToCloudinary(req.files?.thumbnail?.[0]),
                uploadFileToCloudinary(req.files?.promoVideo?.[0]),
                Promise.all(lessonFiles.map((file) => uploadFileToCloudinary(file))),
            ]);

            const lessonVideoMap = new Map(
                lessonVideoIndexes.map((item, index) => [
                    `${item.sectionIndex}:${item.lessonIndex}`,
                    lessonVideoUrls[index] || '',
                ])
            );

            let totalMinutes = 0;
            let totalLessons = 0;
            const syllabus = curriculum
                .map((section, sectionIndex) => {
                    const lessons = Array.isArray(section.lessons) ? section.lessons : [];
                    const lessonDetails = lessons
                        .map((lesson, lessonIndex) => {
                            const lessonTitle = String(lesson.title || '').trim();
                            if (!lessonTitle) return null;
                            const minutes = durationToMinutes(lesson.duration);
                            totalMinutes += minutes;
                            totalLessons += 1;
                            return {
                                title: lessonTitle,
                                duration: formatDuration(minutes),
                                videoUrl: lessonVideoMap.get(`${sectionIndex}:${lessonIndex}`) || '',
                            };
                        })
                        .filter(Boolean);

                    const sectionTitle = String(section.title || '').trim();
                    if (!sectionTitle || !lessonDetails.length) return null;
                    return {
                        title: sectionTitle,
                        lessons: lessonDetails.length,
                        duration: formatDuration(lessonDetails.reduce((sum, lesson) => sum + durationToMinutes(lesson.duration), 0)),
                        items: lessonDetails.map((lesson) => lesson.title),
                        lessonDetails,
                    };
                })
                .filter(Boolean);

            const created = await CourseModel.create({
                title,
                instructorId: instructor._id,
                shortDescription: String(data.overview || '').trim(),
                courseDescription: String(data.overview || '').trim(),
                objectives: Array.isArray(data.objectives) ? data.objectives : [],
                syllabus,
                category: String(data.category || '').trim(),
                level: String(data.level || '').trim(),
                price,
                promotionalPrice: data.promotionalPrice !== undefined && data.promotionalPrice !== null
                    ? Number(data.promotionalPrice)
                    : undefined,
                discount: String(data.discount || '').trim(),
                certification: String(data.certification || '').trim(),
                languages: Array.isArray(data.languages) ? data.languages : [],
                thumbnail,
                promotionalVideo,
                lectures: totalLessons,
                hours: Number((totalMinutes / 60).toFixed(2)),
                status,
            });

            await InstructorModel.updateOne(
                { _id: instructor._id },
                { $inc: { totalCourses: 1 } }
            );

            const result = await CourseModel.findById(created._id)
                .populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail');
            res.status(201).json({ data: result, message: 'Tạo khóa học thành công', success: true });
        } catch (error) {
            next(error);
        }
    },
    updateCourse: async (req, res, next) => {
        try {
            const data = parseJsonField(req.body.data, {});
            const title = String(data.title || '').trim();
            const status = data.status === 'published' ? 'pending' : 'draft';
            const price = Number(data.price ?? 0);
            const curriculum = Array.isArray(data.curriculum) ? data.curriculum : [];

            if (!title) return res.status(400).json({ message: 'Tên khóa học là bắt buộc', success: false });
            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({ message: 'Giá khóa học không hợp lệ', success: false });
            }
            if (status === 'pending' && (!String(data.overview || '').trim() || !curriculum.length || curriculum.some((section) => (
                !String(section.title || '').trim() ||
                !Array.isArray(section.lessons) ||
                !section.lessons.length ||
                section.lessons.some((lesson) => !String(lesson.title || '').trim())
            )))) {
                return res.status(400).json({ message: 'Vui lòng hoàn thiện phần giới thiệu và nội dung bài học', success: false });
            }

            const instructor = await InstructorModel.findOne({ accountId: req.user._id });
            if (!instructor) return res.status(404).json({ message: 'Instructor not found', success: false });

            const course = await CourseModel.findOne({
                _id: req.params.id,
                instructorId: instructor._id,
            });
            if (!course) return res.status(404).json({ message: 'Course not found', success: false });

            const parsedIndexes = parseJsonField(req.body.lessonVideoIndexes, []);
            const lessonVideoIndexes = Array.isArray(parsedIndexes) ? parsedIndexes : [];
            const lessonFiles = req.files?.lessonVideos || [];

            const [uploadedThumbnail, uploadedPromoVideo, lessonVideoUrls] = await Promise.all([
                uploadFileToCloudinary(req.files?.thumbnail?.[0]),
                uploadFileToCloudinary(req.files?.promoVideo?.[0]),
                Promise.all(lessonFiles.map((file) => uploadFileToCloudinary(file))),
            ]);

            const lessonVideoMap = new Map(
                lessonVideoIndexes.map((item, index) => [
                    `${item.sectionIndex}:${item.lessonIndex}`,
                    lessonVideoUrls[index] || '',
                ])
            );

            let totalMinutes = 0;
            let totalLessons = 0;
            const syllabus = curriculum.map((section, sectionIndex) => {
                const lessonDetails = (Array.isArray(section.lessons) ? section.lessons : [])
                    .map((lesson, lessonIndex) => {
                        const lessonTitle = String(lesson.title || '').trim();
                        if (!lessonTitle) return null;
                        const minutes = durationToMinutes(lesson.duration);
                        totalMinutes += minutes;
                        totalLessons += 1;
                        const lessonDoc = {
                            title: lessonTitle,
                            duration: formatDuration(minutes),
                            videoUrl: lessonVideoMap.get(`${sectionIndex}:${lessonIndex}`) || lesson.videoUrl || '',
                        };
                        // Giữ nguyên _id cũ nếu frontend gửi lên — lesson đã tồn tại từ trước.
                        // Không set _id → Mongoose tự sinh mới, coi như lesson mới thêm.
                        if (lesson._id) lessonDoc._id = lesson._id;
                        return lessonDoc;
                    })
                    .filter(Boolean);
                const sectionTitle = String(section.title || '').trim();
                if (!sectionTitle || !lessonDetails.length) return null;
                return {
                    title: sectionTitle,
                    lessons: lessonDetails.length,
                    duration: formatDuration(lessonDetails.reduce((sum, lesson) => sum + durationToMinutes(lesson.duration), 0)),
                    items: lessonDetails.map((lesson) => lesson.title),
                    lessonDetails,
                };
            }).filter(Boolean);

            const thumbnail = uploadedThumbnail || data.thumbnailUrl || course.thumbnail || '';
            const promotionalVideo = uploadedPromoVideo || data.promotionalVideoUrl || course.promotionalVideo || '';

            course.set({
                title,
                shortDescription: String(data.overview || '').trim(),
                courseDescription: String(data.overview || '').trim(),
                objectives: Array.isArray(data.objectives) ? data.objectives : [],
                syllabus,
                category: String(data.category || '').trim(),
                level: String(data.level || '').trim(),
                price,
                discount: String(data.discount || '').trim(),
                certification: String(data.certification || '').trim(),
                languages: Array.isArray(data.languages) ? data.languages : [],
                thumbnail,
                promotionalVideo,
                lectures: totalLessons,
                hours: Number((totalMinutes / 60).toFixed(2)),
                status,
            });

            if (data.promotionalPrice !== undefined && data.promotionalPrice !== null) {
                course.promotionalPrice = Number(data.promotionalPrice);
            } else {
                course.promotionalPrice = undefined;
            }

            await course.save();

            const result = await CourseModel.findById(course._id)
                .populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail');
            res.status(200).json({ data: result, message: 'Cập nhật khóa học thành công', success: true });
        } catch (error) {
            next(error);
        }
    },
    getAllCourse: async(req ,res ,next) =>{
        try{
            const data = await CourseModel.find(publicCourseFilter).populate('instructorId', 'name title').populate('reviews')
            res.status(201).send({ data: data, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    },
    getTopCourse: async(req,res,next) =>{
        try{
            const data = await CourseModel.find(publicCourseFilter).populate('instructorId', 'name title').populate('reviews').sort({ rating: -1 }).limit(4);
            res.status(201).send({ data: data, message: 'data retrieve successful!', success: true });}
        catch(error){
            next(error)
        }
    },
    getCoursebyId :async (req, res, next) =>{
        try {
            const { id } = req.params;
            
            const Mycourse = await CourseModel.findOne({ _id: id, ...publicCourseFilter })
                .populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail')
                .populate('reviews');
            res.status(201).send({ data: Mycourse, message: 'data retrieve successful!', success: true });
        }
        catch(error){
            next(error)
        }
    },
    getTeachingCoursebyId: async (req, res, next) => {
        try {
            const instructor = await InstructorModel.findOne({ accountId: req.user._id });
            if (!instructor) return res.status(404).json({ message: 'Instructor not found', success: false });

            const course = await CourseModel.findOne({
                _id: req.params.id,
                instructorId: instructor._id,
            })
                .populate('instructorId', 'name title bio totalStudents totalCourses totalReviews thumbnail')
                .populate('reviews');

            if (!course) return res.status(404).json({ message: 'Course not found', success: false });
            res.status(200).json({ data: course, message: 'Course retrieved', success: true });
        } catch (error) {
            next(error);
        }
    },
    postCheckout :async (req,res,next) =>{
        try{
        const data = req.body;
        const user = req.user;

        const ops = data.courses.map(courseId => ({
            updateOne: {
                filter: { accountId: user._id, courseId },
                update: { $setOnInsert: { accountId: user._id, courseId } },
                upsert: true
            }
        }));
        console.log(JSON.stringify(ops, null, 1));
        await EnrollmentModel.bulkWrite(ops);

        res.json({ message: "Checkout successful" });
        }
        catch(error){
            next(error)
        }
    },
    postReview:async (req,res,next) =>{
        try{
            const { id: courseId } = req.params;
            const { rating, comment } = req.body;
            const accountId = req.user._id; // lấy từ JWT middleware

            // (optional) kiểm tra user đã enroll course này chưa mới cho review
            
            const enrolled = await EnrollmentModel.findOne({ accountId, courseId });
            if (!enrolled) return res.status(403).json({ message: 'Bạn cần mua khóa học trước khi review', success: false });

            const account = await AccountModel.findById(accountId);
            const displayName = account.Username;

            const review = await ReviewModel.create({ courseId, accountId, name: displayName, rating, comment });
            res.status(201).json({ data: review, message: 'Review created', success: true });
        }
        catch(error){
            next(error)
        }
    },
    getReviews:async (req,res,next) => {
        try {
            const user = req.user ;
            const reviews = await ReviewModel.find({accountId:user._id}).populate('courseId','title -_id')
            res.status(200).json({data:reviews,message: 'Review retrieved', success: true })
        }catch(error){
            next(error)
        }
    },
    putReviews:async (req,res,next) => {
        try{
            const user = req.user;
            const { id } = req.params;
            const { rating, comment } = req.body

            const updated = await ReviewModel.findOneAndUpdate(
                { _id: id, accountId: user._id },
                { $set: { rating, comment } },
                { new: true, runValidators: true }
            ).populate('courseId', 'title -_id');;

            if (!updated) {
                const err = new Error('Review not found or not yours to edit');
                err.status = 404; 
                throw err;
            }
            res.status(200).json({data:updated,message: 'Review updated', success: true })
        }
        catch(error){
            next(error)
        }
    },
    deleteReviews:async (req,res,next) => {
        try{
            const user = req.user;
            const { id } = req.params;
            const { rating, comment } = req.body

            const deleted = await ReviewModel.findOneAndDelete(
                { _id: id, accountId: user._id }
            ).populate('courseId', 'title -_id');;

            if (!deleted) {
                const err = new Error('Review not found or not yours to edit');
                err.status = 404; 
                throw err;
            }
            res.status(200).json({data:deleted,message: 'Review updated', success: true })
        }
        catch(error){
            next(error)
        }
    },// GET /account/enrollments/:courseId/progress
    getProgress: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            const accountId = req.user._id;

            const enrollment = await EnrollmentModel.findOne({ accountId, courseId }).lean();
            if (!enrollment) {
                return res.status(404).json({ message: 'Chưa mua khóa học này', success: false });
            }

            const course = await CourseModel.findById(courseId).select('syllabus').lean();
            const totalLessons = course.syllabus.reduce((sum, s) => sum + s.lessonDetails.length, 0);
            const completedCount = enrollment.completedLessons?.length ?? 0;
            const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

            res.status(200).json({
                data: {
                    completedLessons: enrollment.completedLessons ?? [],
                    lastAccessedLessonId: enrollment.lastAccessedLessonId,
                    progressPercent, // luôn tính server-side, không lưu vào DB
                },
                success: true,
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /account/enrollments/:courseId/progress
    updateProgress: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            const { lessonId } = req.body; // chỉ nhận lessonId vừa hoàn thành
            const accountId = req.user._id;

            if (!lessonId) {
                return res.status(400).json({ message: 'Thiếu lessonId', success: false });
            }

            const enrollment = await EnrollmentModel.findOneAndUpdate(
                { accountId, courseId },
                {
                    $addToSet: { completedLessons: lessonId }, // tránh trùng lặp
                    $set: { lastAccessedLessonId: lessonId },
                },
                { new: true, runValidators: true }
            );

            if (!enrollment) {
                return res.status(404).json({ message: 'Chưa mua khóa học này', success: false });
            }

            res.status(200).json({ data: enrollment, message: 'Cập nhật tiến trình thành công', success: true });
        } catch (error) {
            next(error);
        }
    }
    
}
export default courseController
