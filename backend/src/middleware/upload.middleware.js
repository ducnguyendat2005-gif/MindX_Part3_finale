import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ chấp nhận file PDF, JPG hoặc PNG'), false);
};

export const uploadPortfolio = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB / file
}).array('portfolioFiles', 3); // ← đổi .single() thành .array(), tối đa 3 file