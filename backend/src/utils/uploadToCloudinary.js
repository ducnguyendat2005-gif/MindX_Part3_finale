// backend/src/utils/uploadToCloudinary.js
import cloudinary from '../config/cloudinary.js';

const mimeToExt = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const uploadBufferToCloudinary = (buffer, mimetype, folder = 'byway/portfolios') => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype === 'application/pdf'
    ? 'raw'
    : mimetype.startsWith('video/')
      ? 'video'
      : 'image';
    const ext = mimeToExt[mimetype] || '';

    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };

    // Với raw, cần tự gắn đuôi vào public_id để URL trả về có .pdf ở cuối
    if (resourceType === 'raw' && ext) {
      const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      uploadOptions.public_id = uniqueName;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};