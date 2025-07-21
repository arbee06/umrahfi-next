import { authMiddleware } from '@/middleware/auth';
import { Package } from '@/models';

export default async function handler(req, res) {
  // Apply auth middleware for admin only
  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method } = req;

  if (method === 'GET') {
    try {
      const packages = await Package.findAll({
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        packages: packages || []
      });
    } catch (error) {
      console.error('Error fetching packages:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch packages' 
      });
    }
  } else if (method === 'POST') {
    try {
      const packageData = req.body;
      
      // Validate required fields
      if (!packageData.title || !packageData.description || !packageData.price || !packageData.companyId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create the package
      const newPackage = await Package.create(packageData);

      return res.status(201).json({
        success: true,
        package: newPackage
      });
    } catch (error) {
      console.error('Error creating package:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to create package' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}