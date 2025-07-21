import { authMiddleware } from '@/middleware/auth';
import { User, Subscription } from '@/models';
import { getSubscriptionPlan } from '@/config/subscriptionPlans';

export default async function handler(req, res) {
  // Apply auth middleware for admin only
  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method, query } = req;
  const { id } = query;

  if (method === 'PUT') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const company = await User.findByPk(parseInt(id));
      if (!company || company.role !== 'company') {
        return res.status(404).json({ error: 'Company not found' });
      }

      const { action, planId, days, reason, adminId } = req.body;

      let updateData = {};
      let subscriptionData = {};

      switch (action) {
        case 'upgrade':
        case 'downgrade':
        case 'change-plan':
          if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required for plan changes' });
          }

          const plan = getSubscriptionPlan(planId);
          if (!plan) {
            return res.status(400).json({ error: 'Invalid plan ID' });
          }

          // Calculate new end date (extend by billing cycle)
          const currentDate = new Date();
          const newEndDate = new Date(currentDate);
          newEndDate.setMonth(newEndDate.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

          updateData = {
            subscriptionStatus: 'active',
            subscriptionPlan: planId,
            subscriptionStartDate: currentDate,
            subscriptionEndDate: newEndDate,
            subscriptionFeatures: plan.features
          };

          subscriptionData = {
            companyId: company.id,
            planId: planId,
            planName: plan.name,
            status: 'active',
            billingCycle: plan.billingCycle,
            price: plan.price,
            currency: plan.currency,
            startDate: currentDate,
            endDate: newEndDate,
            maxPackages: plan.features.maxPackages,
            maxBookingsPerMonth: plan.features.maxBookingsPerMonth,
            maxPhotosPerPackage: plan.features.maxPhotosPerPackage,
            prioritySupport: plan.features.prioritySupport,
            featuredListings: plan.features.featuredListings,
            analyticsAccess: plan.features.analyticsAccess,
            adminNotes: `Plan changed to ${plan.name} by admin`,
            createdBy: adminId,
            modifiedBy: adminId
          };
          break;

        case 'cancel':
          if (!reason) {
            return res.status(400).json({ error: 'Cancellation reason is required' });
          }

          updateData = {
            subscriptionStatus: 'cancelled'
          };

          // Update existing subscription
          const existingSubscription = await Subscription.findOne({
            where: { companyId: company.id, status: 'active' }
          });

          if (existingSubscription) {
            await existingSubscription.update({
              status: 'cancelled',
              cancelledAt: new Date(),
              cancelledBy: adminId,
              cancellationReason: reason,
              adminNotes: `Cancelled by admin: ${reason}`,
              modifiedBy: adminId
            });
          }
          break;

        case 'activate':
          // If no plan set, default to free plan
          const currentPlan = company.subscriptionPlan || 'free';
          const activePlan = getSubscriptionPlan(currentPlan);
          
          if (!activePlan) {
            return res.status(400).json({ error: 'Invalid subscription plan' });
          }

          // Extend subscription by 1 month from today
          const activationDate = new Date();
          const activationEndDate = new Date(activationDate);
          activationEndDate.setMonth(activationEndDate.getMonth() + 1);

          updateData = {
            subscriptionStatus: 'active',
            subscriptionPlan: currentPlan,
            subscriptionStartDate: activationDate,
            subscriptionEndDate: activationEndDate,
            subscriptionFeatures: activePlan.features
          };

          subscriptionData = {
            companyId: company.id,
            planId: currentPlan,
            planName: activePlan.name,
            status: 'active',
            billingCycle: activePlan.billingCycle || 'monthly',
            price: activePlan.price,
            currency: activePlan.currency || 'USD',
            startDate: activationDate,
            endDate: activationEndDate,
            maxPackages: activePlan.features.maxPackages,
            maxBookingsPerMonth: activePlan.features.maxBookingsPerMonth,
            maxPhotosPerPackage: activePlan.features.maxPhotosPerPackage,
            prioritySupport: activePlan.features.prioritySupport,
            featuredListings: activePlan.features.featuredListings,
            analyticsAccess: activePlan.features.analyticsAccess,
            adminNotes: 'Subscription activated by admin',
            createdBy: adminId,
            modifiedBy: adminId
          };
          break;

        case 'extend':
          if (!days || days < 1 || days > 365) {
            return res.status(400).json({ error: 'Days must be between 1 and 365' });
          }

          // Extend current subscription end date
          const currentEndDate = company.subscriptionEndDate ? new Date(company.subscriptionEndDate) : new Date();
          const extendedEndDate = new Date(currentEndDate);
          extendedEndDate.setDate(extendedEndDate.getDate() + parseInt(days));

          updateData = {
            subscriptionEndDate: extendedEndDate
          };

          // Update existing subscription
          const currentSubscription = await Subscription.findOne({
            where: { companyId: company.id, status: 'active' }
          });

          if (currentSubscription) {
            await currentSubscription.update({
              endDate: extendedEndDate,
              adminNotes: `Subscription extended by ${days} days by admin`,
              modifiedBy: adminId
            });
          }
          break;

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      // Update company subscription status
      await company.update(updateData);

      // Create new subscription record if needed
      if (subscriptionData.companyId) {
        await Subscription.create(subscriptionData);
      }

      return res.status(200).json({
        success: true,
        message: `Subscription ${action}d successfully`
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to update subscription' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}