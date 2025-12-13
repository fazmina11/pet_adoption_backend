const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image file'), false);
  }
};

// Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Upload to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'pet-adoption',
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary error:', error);
    throw new Error('Failed to upload to Cloudinary');
  }
};

// Export both
module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;