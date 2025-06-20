import { removeTokenCookie } from '@/utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  removeTokenCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}