import { Package, User } from '@/models';
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const packageData = await Package.findByPk(id, {
          include: [{
            model: User,
            as: 'company',
            attributes: [
              'companyName', 
              'email', 
              'phone', 
              'companyAddress',
              'preferredPaymentMethods',
              'acceptCashPayments',
              'acceptBankTransfers',
              'stripePublishableKey'
            ]
          }]
        });

        if (!packageData) {
          return res.status(404).json({ error: 'Package not found' });
        }

        res.status(200).json({
          success: true,
          package: packageData
        });
      } catch (error) {
        console.error('Get package error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'PUT':
      const authResultPut = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResultPut?.user) return;

      try {
        const packageData = await Package.findByPk(id);

        if (!packageData) {
          return res.status(404).json({ error: 'Package not found' });
        }

        // Check ownership
        if (authResultPut.user.role === 'company' && 
            packageData.companyId !== authResultPut.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updatedPackage = await packageData.update(req.body);

        res.status(200).json({
          success: true,
          package: updatedPackage
        });
      } catch (error) {
        console.error('Update package error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'DELETE':
      const authResultDelete = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResultDelete?.user) return;

      try {
        const packageData = await Package.findByPk(id);

        if (!packageData) {
          return res.status(404).json({ error: 'Package not found' });
        }

        // Check ownership
        if (authResultDelete.user.role === 'company' && 
            packageData.companyId !== authResultDelete.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        await packageData.destroy();

        res.status(200).json({
          success: true,
          message: 'Package deleted successfully'
        });
      } catch (error) {
        console.error('Delete package error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}