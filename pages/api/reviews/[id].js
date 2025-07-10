// pages/api/reviews/[id].js
import { authMiddleware } from '@/middleware/auth';
import Review from '@/models/Review';
import User from '@/models/User';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'GET') {
      const review = await Review.findByPk(id, {
        include: [
          {
            model: User,
            foreignKey: 'customerId',
            attributes: ['id', 'name', 'profilePicture']
          }
        ]
      });
      
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      return res.status(200).json(review);
    }
    
    if (req.method === 'PUT') {
      // Apply auth middleware
      const authResult = await authMiddleware([])(req, res);
      if (!authResult || !authResult.user) {
        return; // Response already sent by middleware
      }
      
      const review = await Review.findByPk(id);
      
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      // Companies can only add responses
      if (authResult.user.role === 'company') {
        if (review.companyId !== authResult.user.id) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { response } = req.body;
        
        await review.update({
          response,
          responseDate: new Date()
        });
        
        return res.status(200).json(review);
      }
      
      // Customers can mark reviews as helpful
      if (authResult.user.role === 'customer') {
        const { helpful } = req.body;
        
        if (helpful !== undefined) {
          await review.update({
            helpful: review.helpful + (helpful ? 1 : -1)
          });
        }
        
        return res.status(200).json(review);
      }
      
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Review API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}