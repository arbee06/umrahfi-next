import { authMiddleware } from '@/middleware/auth';
import { User } from '@/models';

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
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Fetch user details
      const user = await User.findByPk(parseInt(id), {
        attributes: { exclude: ['password'] } // Exclude password from response
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch user details' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}