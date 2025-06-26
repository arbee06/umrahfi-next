import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '@/middleware/auth';
const User = require('../../../models/User');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply auth middleware
  const authResult = await authMiddleware([])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  try {
    const userId = authResult.user.id;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: function ({ mimetype }) {
        // Only allow image files
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.profilePicture || files.profilePicture.length === 0) {
      return res.status(400).json({ error: 'No profile picture provided' });
    }

    const file = Array.isArray(files.profilePicture) ? files.profilePicture[0] : files.profilePicture;
    
    // Generate unique filename
    const fileExt = path.extname(file.originalFilename || file.name || '');
    const fileName = `${userId}-${Date.now()}${fileExt}`;
    const newPath = path.join(uploadDir, fileName);
    
    // Move file to final location
    fs.renameSync(file.filepath, newPath);
    
    // Get user and delete old profile picture if exists
    const user = await User.findByPk(userId);
    if (user.profilePicture) {
      const oldPath = path.join(process.cwd(), 'public', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Update user with new profile picture path
    const profilePicturePath = `/uploads/profile-pictures/${fileName}`;
    await user.update({ profilePicture: profilePicturePath });
    
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePicturePath
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
}