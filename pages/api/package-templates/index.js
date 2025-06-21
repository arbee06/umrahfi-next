import { PackageTemplate } from '@/models';
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      const authResult = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResult?.user) return;

      try {
        const { type } = req.query;
        const where = { companyId: authResult.user.id };
        
        if (type && ['inclusions', 'exclusions'].includes(type)) {
          where.type = type;
        }

        const templates = await PackageTemplate.findAll({
          where,
          order: [['isDefault', 'DESC'], ['name', 'ASC']]
        });

        res.status(200).json({
          success: true,
          templates
        });
      } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'POST':
      const authResultPost = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResultPost?.user) return;

      try {
        const { name, description, type, items, isDefault } = req.body;

        if (!name || !type || !['inclusions', 'exclusions'].includes(type)) {
          return res.status(400).json({ error: 'Name and valid type are required' });
        }

        if (!Array.isArray(items)) {
          return res.status(400).json({ error: 'Items must be an array' });
        }

        // If setting as default, remove default from other templates of same type
        if (isDefault) {
          await PackageTemplate.update(
            { isDefault: false },
            { 
              where: { 
                companyId: authResultPost.user.id, 
                type: type,
                isDefault: true 
              } 
            }
          );
        }

        const template = await PackageTemplate.create({
          name,
          description,
          type,
          items,
          isDefault: isDefault || false,
          companyId: authResultPost.user.id
        });

        res.status(201).json({
          success: true,
          template
        });
      } catch (error) {
        console.error('Create template error:', error);
        if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}