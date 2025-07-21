import { authMiddleware } from '@/middleware/auth';
import { Package } from '@/models';

export default async function handler(req, res) {
  // Apply auth middleware for admin only
  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method, query } = req;
  const { companyId } = query;

  if (method === 'GET') {
    try {
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      // Fetch packages for the specific company
      const packages = await Package.findAll({
        where: { companyId: parseInt(companyId) },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        packages: packages || []
      });
    } catch (error) {
      console.error('Error fetching company packages:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch company packages' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}