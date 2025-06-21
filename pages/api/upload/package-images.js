import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '@/middleware/auth';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads/package-images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `package_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Disable Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authResult = await authMiddleware(['company', 'admin'])(req, res);
  if (!authResult?.user) return;

  // Use multer middleware
  upload.array('images', 10)(req, res, function (err) {
    if (err) {
      console.error('Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum 5MB per file.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed.' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      // Process uploaded files
      const uploadedImages = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: `/uploads/package-images/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.status(200).json({
        success: true,
        images: uploadedImages,
        message: `${uploadedImages.length} image(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Process upload error:', error);
      res.status(500).json({ error: 'Failed to process uploaded files' });
    }
  });
}