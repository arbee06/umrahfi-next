import { PackageTemplate } from '@/models';
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'PUT':
      const authResult = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResult?.user) return;

      try {
        const template = await PackageTemplate.findOne({
          where: { 
            id, 
            companyId: authResult.user.id 
          }
        });

        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }

        const { name, description, type, items, isDefault } = req.body;

        if (type && !['inclusions', 'exclusions'].includes(type)) {
          return res.status(400).json({ error: 'Invalid type' });
        }

        if (items && !Array.isArray(items)) {
          return res.status(400).json({ error: 'Items must be an array' });
        }

        // If setting as default, remove default from other templates of same type
        if (isDefault && type) {
          await PackageTemplate.update(
            { isDefault: false },
            { 
              where: { 
                companyId: authResult.user.id, 
                type: type,
                isDefault: true,
                id: { [require('sequelize').Op.ne]: id }
              } 
            }
          );
        }

        await template.update({
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(type && { type }),
          ...(items && { items }),
          ...(isDefault !== undefined && { isDefault })
        });

        res.status(200).json({
          success: true,
          template
        });
      } catch (error) {
        console.error('Update template error:', error);
        if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'DELETE':
      const authResultDelete = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResultDelete?.user) return;

      try {
        const template = await PackageTemplate.findOne({
          where: { 
            id, 
            companyId: authResultDelete.user.id 
          }
        });

        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }

        await template.destroy();

        res.status(200).json({
          success: true,
          message: 'Template deleted successfully'
        });
      } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}