import { authMiddleware } from '@/middleware/auth';
import { Subscription, User } from '@/models';

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

      // Verify company exists
      const company = await User.findByPk(parseInt(companyId));
      if (!company || company.role !== 'company') {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Get all subscriptions for this company
      const subscriptions = await Subscription.findAll({
        where: { companyId: parseInt(companyId) },
        include: [
          {
            model: User,
            as: 'company',
            attributes: ['id', 'name', 'companyName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        subscriptions: subscriptions || []
      });
    } catch (error) {
      console.error('Error fetching company subscriptions:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch company subscriptions' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}