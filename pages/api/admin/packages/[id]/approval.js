import { authMiddleware } from '@/middleware/auth';
import { Package } from '@/models';

export default async function handler(req, res) {
  // Apply auth middleware for admin only
  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method, query } = req;
  const { id } = query;

  if (method === 'PUT') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Package ID is required' });
      }

      const packageData = await Package.findByPk(parseInt(id));

      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }

      const updateData = req.body;
      
      // Validate approval status
      if (!updateData.adminApprovalStatus || !['approved', 'rejected'].includes(updateData.adminApprovalStatus)) {
        return res.status(400).json({ error: 'Invalid approval status' });
      }

      await packageData.update(updateData);

      return res.status(200).json({
        success: true,
        package: packageData,
        message: `Package ${updateData.adminApprovalStatus} successfully`
      });
    } catch (error) {
      console.error('Error updating package approval:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to update package approval' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}