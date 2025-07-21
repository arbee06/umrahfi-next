import { authMiddleware } from '@/middleware/auth';
import { Order } from '@/models';

export default async function handler(req, res) {
  // Apply auth middleware for admin only
  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method, query } = req;
  const { customerId } = query;

  if (method === 'GET') {
    try {
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }

      // Fetch bookings for the specific customer
      const bookings = await Order.findAll({
        where: { customerId: parseInt(customerId) },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        bookings: bookings || []
      });
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch customer bookings' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}