import { authMiddleware } from '@/middleware/auth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'payment-receipts');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authMiddleware(['customer'])(req, res);
  if (!authResult?.user) return;

  try {
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: function ({ name, originalFilename, mimetype }) {
        // Only allow image files
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await form.parse(req);

    const file = files.receipt?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalFilename || '');
    const newFileName = `receipt_${authResult.user.id}_${timestamp}_${randomString}${fileExtension}`;
    const newFilePath = path.join(UPLOAD_DIR, newFileName);

    // Move file to new location with unique name
    fs.renameSync(file.filepath, newFilePath);

    // Return file information
    const fileUrl = `/uploads/payment-receipts/${newFileName}`;
    
    res.status(200).json({
      success: true,
      file: {
        filename: newFileName,
        originalName: file.originalFilename,
        path: fileUrl,
        size: file.size,
        mimetype: file.mimetype
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}