import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authMiddleware([])(req, res);
  
  if (authResult && authResult.user) {
    const userResponse = authResult.user.toJSON();
    delete userResponse.password;
    res.status(200).json({ success: true, user: userResponse });
  }
}