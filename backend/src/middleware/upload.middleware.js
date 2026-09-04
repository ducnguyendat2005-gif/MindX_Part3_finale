import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const portfolioStorage = multer.memoryStorage();
const portfolioFileFilter = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF, JPG, or PNG files are accepted'), false);
};

export const uploadPortfolio = multer({
  storage: portfolioStorage,
  fileFilter: portfolioFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB / file
}).array('portfolioFiles', 3); // ← đổi .single() thành .array(), tối đa 3 file

const avatarFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, or WEBP files are accepted'), false);
};

export const uploadAvatar = multer({
  storage: portfolioStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');  // ← field name FE phải append đúng là 'avatar'

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const courseUploadDir = path.resolve(currentDir, '../../uploads/courses');
fs.mkdirSync(courseUploadDir, { recursive: true });
const courseStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, courseUploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
  },
});

const courseFileFilter = (_req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/webm',
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPG, PNG, GIF images or MP4, WebM videos are accepted'));
};
export const uploadCourseMedia = multer({
  storage: portfolioStorage, // dùng chung memoryStorage với portfolio/avatar
  fileFilter: courseFileFilter,
  limits: { fileSize: 250 * 1024 * 1024 },
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'promoVideo', maxCount: 1 },
  { name: 'lessonVideos', maxCount: 100 },
]);