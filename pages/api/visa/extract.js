import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  }
});

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to run middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Simple file upload handler - no extraction needed
const processVisaUpload = async (fileBuffer, filename, contentType) => {
  // Save the image file locally
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'visas');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const savedFilename = `visa_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const filepath = path.join(uploadsDir, savedFilename);
  fs.writeFileSync(filepath, fileBuffer);

  // Generate file hash and return info with image path
  const fileHash = require('crypto').createHash('md5').update(fileBuffer).digest('hex');
  
  return {
    success: true,
    message: 'Visa document uploaded successfully',
    file_info: {
      filename: filename,
      size: fileBuffer.length,
      type: contentType,
      file_hash: fileHash,
      image_path: `/uploads/visas/${savedFilename}`
    }
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing visa file:', req.file.originalname, req.file.size);

    // Process visa file upload (no extraction needed)
    const result = await processVisaUpload(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype
    );

    // Return the extracted data
    res.status(200).json(result);
  } catch (error) {
    console.error('Visa extraction error:', error);
    
    if (error.message === 'Invalid file type. Only image files are allowed.') {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload an image file (JPG, PNG, GIF, BMP, TIFF, WEBP).',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process visa image',
    });
  }
}