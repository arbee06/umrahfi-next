import { verifyToken } from '@/utils/auth';
import { User } from '@/models';

export const authMiddleware = (allowedRoles = []) => {
  return async (req, res) => {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.user = user;
      return { user };
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  };
};

export const isAdmin = authMiddleware(['admin']);
export const isCompany = authMiddleware(['company', 'admin']);
export const isAuthenticated = authMiddleware([]);