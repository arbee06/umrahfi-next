import { Package } from '@/models';
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult?.user) return;

  const { id } = req.query;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['active', 'inactive', 'pending'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: active, inactive, pending' 
    });
  }

  try {
    const packageData = await Package.findByPk(id);

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await packageData.update({ status });

    res.status(200).json({
      success: true,
      message: `Package status updated to ${status}`,
      package: packageData
    });
  } catch (error) {
    console.error('Update package status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}