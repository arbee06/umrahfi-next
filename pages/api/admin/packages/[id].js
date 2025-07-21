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

  if (method === 'GET') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Package ID is required' });
      }

      const packageData = await Package.findByPk(parseInt(id));

      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }

      return res.status(200).json({
        success: true,
        package: packageData
      });
    } catch (error) {
      console.error('Error fetching package:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch package' 
      });
    }
  } else if (method === 'PUT') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Package ID is required' });
      }

      const packageData = await Package.findByPk(parseInt(id));

      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }

      const updateData = req.body;
      await packageData.update(updateData);

      return res.status(200).json({
        success: true,
        package: packageData
      });
    } catch (error) {
      console.error('Error updating package:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to update package' 
      });
    }
  } else if (method === 'DELETE') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Package ID is required' });
      }

      const packageData = await Package.findByPk(parseInt(id));

      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }

      await packageData.destroy();

      return res.status(200).json({
        success: true,
        message: 'Package deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting package:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to delete package' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}