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

    // Prepare form data for external API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Call the passport extraction API
    const response = await axios.post('https://passport.akbarstudios.com/extract', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Save the image file locally
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'passports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `passport_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    // Add image path to response
    const responseData = response.data;
    if (responseData.success && responseData.passport_data) {
      responseData.passport_data.image_path = `/uploads/passports/${filename}`;
    }

    // Return the response from the external API with image path
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Passport extraction error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Failed to extract passport data',
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(503).json({
        success: false,
        error: 'Passport extraction service is currently unavailable',
      });
    } else {
      // Something happened in setting up the request
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process passport image',
      });
    }
  }
}