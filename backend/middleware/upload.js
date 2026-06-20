const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/i;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// Configure Cloudinary
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configure Supabase
const isSupabaseConfigured = 
  process.env.SUPABASE_URL && 
  process.env.SUPABASE_KEY;

let supabase;
if (isSupabaseConfigured) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
}

// Middleware helper to upload to Supabase or Cloudinary (with local fallback)
const handleReceiptUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // 1. Try Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileName = req.file.filename;
      const bucketName = process.env.SUPABASE_BUCKET || 'receipts';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      req.receiptUrl = publicUrlData.publicUrl;

      // Delete local temp file
      fs.unlinkSync(req.file.path);
      return next();
    } catch (error) {
      console.error('Supabase Storage upload error, trying fallback:', error);
      // Fall through to next options
    }
  }

  // 2. Try Cloudinary if configured
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'manivtha_travels_receipts',
        resource_type: 'image',
      });

      // Delete local temp file
      fs.unlinkSync(req.file.path);

      // Save Cloudinary URL to request object
      req.receiptUrl = result.secure_url;
      return next();
    } catch (error) {
      console.error('Cloudinary upload error, falling back to local storage:', error);
      // Fall through to local
    }
  }

  // 3. Fallback to serving the local file
  req.receiptUrl = `/uploads/${req.file.filename}`;
  next();
};

module.exports = { upload, handleReceiptUpload };
