import { User, Package, Order } from '@/models';
import { getSubscriptionPlan, validateSubscriptionLimits } from '@/config/subscriptionPlans';
import { Op } from 'sequelize';

/**
 * Subscription enforcement utility
 * This utility provides methods to check subscription limits and enforce restrictions
 */

class SubscriptionEnforcement {
  /**
   * Check if a company can perform a specific action based on their subscription
   * @param {number} companyId - The company ID
   * @param {string} action - The action to check (create_package, create_booking, etc.)
   * @param {Object} options - Additional options for the check
   * @returns {Object} - Result object with allowed status and details
   */
  async checkActionAllowed(companyId, action, options = {}) {
    try {
      const company = await User.findByPk(companyId);
      if (!company || company.role !== 'company') {
        return { allowed: false, reason: 'Company not found' };
      }

      // If subscription is inactive, expired, or cancelled, deny all actions
      if (['inactive', 'expired', 'cancelled'].includes(company.subscriptionStatus)) {
        return { 
          allowed: false, 
          reason: `Subscription is ${company.subscriptionStatus}. Please contact support to reactivate.`,
          subscriptionStatus: company.subscriptionStatus
        };
      }

      // Check if subscription has expired
      if (company.subscriptionEndDate && new Date() > new Date(company.subscriptionEndDate)) {
        // Update status to expired
        await company.update({ subscriptionStatus: 'expired' });
        return { 
          allowed: false, 
          reason: 'Subscription has expired. Please renew to continue.',
          subscriptionStatus: 'expired'
        };
      }

      // Check if trial has expired but subscription is still in trial
      if (company.subscriptionStatus === 'trial' && company.trialEndDate && new Date() > new Date(company.trialEndDate)) {
        // Update status to expired
        await company.update({ subscriptionStatus: 'expired' });
        return { 
          allowed: false, 
          reason: 'Trial period has expired. Please upgrade to continue.',
          subscriptionStatus: 'expired'
        };
      }

      // Get subscription plan
      const plan = getSubscriptionPlan(company.subscriptionPlan);
      if (!plan) {
        return { 
          allowed: false, 
          reason: 'Invalid subscription plan. Please contact support.',
          subscriptionStatus: company.subscriptionStatus
        };
      }

      // Get current usage
      const usage = await this.getCurrentUsage(companyId);

      // Check specific action limits
      switch (action) {
        case 'create_package':
          return await this.checkPackageLimit(plan, usage);
        case 'create_booking':
          return await this.checkBookingLimit(plan, usage);
        case 'upload_photos':
          return await this.checkPhotoLimit(plan, usage, options.packageId);
        case 'access_analytics':
          return this.checkFeatureAccess(plan, 'analyticsAccess');
        case 'priority_support':
          return this.checkFeatureAccess(plan, 'prioritySupport');
        case 'featured_listings':
          return this.checkFeatureAccess(plan, 'featuredListings');
        default:
          return { allowed: true, reason: 'No specific limits for this action' };
      }
    } catch (error) {
      console.error('Error checking subscription limits:', error);
      return { 
        allowed: false, 
        reason: 'Error checking subscription limits. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Get current usage stats for a company
   * @param {number} companyId - The company ID
   * @returns {Object} - Usage statistics
   */
  async getCurrentUsage(companyId) {
    try {
      const [packageCount, monthlyBookings, maxPhotosInPackage] = await Promise.all([
        // Count total packages
        Package.count({ where: { companyId } }),
        
        // Count bookings this month
        Order.count({
          where: {
            companyId,
            createdAt: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        
        // Get maximum photos in any package (placeholder - would need actual photo count)
        Promise.resolve(0) // TODO: Implement actual photo counting when photo system is ready
      ]);

      return {
        packages: packageCount,
        bookingsThisMonth: monthlyBookings,
        maxPhotosInPackage: maxPhotosInPackage
      };
    } catch (error) {
      console.error('Error getting current usage:', error);
      throw error;
    }
  }

  /**
   * Check if company can create a new package
   * @param {Object} plan - Subscription plan
   * @param {Object} usage - Current usage
   * @returns {Object} - Result object
   */
  async checkPackageLimit(plan, usage) {
    const limit = plan.features.maxPackages;
    
    if (limit === -1) {
      return { allowed: true, reason: 'Unlimited packages allowed' };
    }

    if (usage.packages >= limit) {
      return { 
        allowed: false, 
        reason: `Package limit reached. Your plan allows ${limit} packages, you currently have ${usage.packages}.`,
        limit: limit,
        current: usage.packages
      };
    }

    return { 
      allowed: true, 
      reason: `Package creation allowed. ${usage.packages}/${limit} packages used.`,
      limit: limit,
      current: usage.packages
    };
  }

  /**
   * Check if company can create a new booking
   * @param {Object} plan - Subscription plan
   * @param {Object} usage - Current usage
   * @returns {Object} - Result object
   */
  async checkBookingLimit(plan, usage) {
    const limit = plan.features.maxBookingsPerMonth;
    
    if (limit === -1) {
      return { allowed: true, reason: 'Unlimited bookings allowed' };
    }

    if (usage.bookingsThisMonth >= limit) {
      return { 
        allowed: false, 
        reason: `Monthly booking limit reached. Your plan allows ${limit} bookings per month, you currently have ${usage.bookingsThisMonth}.`,
        limit: limit,
        current: usage.bookingsThisMonth
      };
    }

    return { 
      allowed: true, 
      reason: `Booking creation allowed. ${usage.bookingsThisMonth}/${limit} bookings used this month.`,
      limit: limit,
      current: usage.bookingsThisMonth
    };
  }

  /**
   * Check if company can upload photos to a package
   * @param {Object} plan - Subscription plan
   * @param {Object} usage - Current usage
   * @param {number} packageId - Package ID
   * @returns {Object} - Result object
   */
  async checkPhotoLimit(plan, usage, packageId) {
    const limit = plan.features.maxPhotosPerPackage;
    
    if (limit === -1) {
      return { allowed: true, reason: 'Unlimited photos allowed' };
    }

    // TODO: Get actual photo count for the package when photo system is implemented
    const currentPhotos = 0;

    if (currentPhotos >= limit) {
      return { 
        allowed: false, 
        reason: `Photo limit reached for this package. Your plan allows ${limit} photos per package, this package has ${currentPhotos}.`,
        limit: limit,
        current: currentPhotos
      };
    }

    return { 
      allowed: true, 
      reason: `Photo upload allowed. ${currentPhotos}/${limit} photos used in this package.`,
      limit: limit,
      current: currentPhotos
    };
  }

  /**
   * Check if company has access to a specific feature
   * @param {Object} plan - Subscription plan
   * @param {string} feature - Feature name
   * @returns {Object} - Result object
   */
  checkFeatureAccess(plan, feature) {
    const hasAccess = plan.features[feature] === true;
    
    return {
      allowed: hasAccess,
      reason: hasAccess 
        ? `Feature ${feature} is included in your plan.`
        : `Feature ${feature} is not included in your plan. Please upgrade to access this feature.`,
      feature: feature,
      planName: plan.name
    };
  }

  /**
   * Get subscription status and upgrade suggestions
   * @param {number} companyId - The company ID
   * @returns {Object} - Subscription status and suggestions
   */
  async getSubscriptionStatus(companyId) {
    try {
      const company = await User.findByPk(companyId);
      if (!company || company.role !== 'company') {
        return { error: 'Company not found' };
      }

      const plan = getSubscriptionPlan(company.subscriptionPlan);
      const usage = await this.getCurrentUsage(companyId);

      // Check if limits are being approached
      const warnings = [];
      
      if (plan.features.maxPackages !== -1) {
        const packageUsage = (usage.packages / plan.features.maxPackages) * 100;
        if (packageUsage >= 80) {
          warnings.push({
            type: 'package_limit',
            message: `You're using ${usage.packages} of ${plan.features.maxPackages} packages (${Math.round(packageUsage)}%).`,
            severity: packageUsage >= 95 ? 'critical' : 'warning'
          });
        }
      }

      if (plan.features.maxBookingsPerMonth !== -1) {
        const bookingUsage = (usage.bookingsThisMonth / plan.features.maxBookingsPerMonth) * 100;
        if (bookingUsage >= 80) {
          warnings.push({
            type: 'booking_limit',
            message: `You're using ${usage.bookingsThisMonth} of ${plan.features.maxBookingsPerMonth} monthly bookings (${Math.round(bookingUsage)}%).`,
            severity: bookingUsage >= 95 ? 'critical' : 'warning'
          });
        }
      }

      // Check subscription expiry
      if (company.subscriptionEndDate) {
        const daysUntilExpiry = Math.ceil((new Date(company.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          warnings.push({
            type: 'subscription_expiry',
            message: `Your subscription expires in ${daysUntilExpiry} days.`,
            severity: daysUntilExpiry <= 3 ? 'critical' : 'warning'
          });
        }
      }

      return {
        status: company.subscriptionStatus,
        plan: plan,
        usage: usage,
        warnings: warnings,
        subscriptionEndDate: company.subscriptionEndDate,
        trialEndDate: company.trialEndDate
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { error: 'Error retrieving subscription status' };
    }
  }

  /**
   * Get upgrade suggestions based on current usage
   * @param {number} companyId - The company ID
   * @returns {Object} - Upgrade suggestions
   */
  async getUpgradeSuggestions(companyId) {
    try {
      const status = await this.getSubscriptionStatus(companyId);
      if (status.error) return status;

      const currentPlan = status.plan;
      const usage = status.usage;
      const suggestions = [];

      // Check if current limits are being exceeded or approached
      if (currentPlan.features.maxPackages !== -1 && usage.packages >= currentPlan.features.maxPackages * 0.8) {
        suggestions.push({
          reason: 'Package limit approaching',
          suggestion: 'Consider upgrading to a plan with more package allowance',
          urgency: usage.packages >= currentPlan.features.maxPackages ? 'critical' : 'recommended'
        });
      }

      if (currentPlan.features.maxBookingsPerMonth !== -1 && usage.bookingsThisMonth >= currentPlan.features.maxBookingsPerMonth * 0.8) {
        suggestions.push({
          reason: 'Monthly booking limit approaching',
          suggestion: 'Consider upgrading to a plan with higher monthly booking limits',
          urgency: usage.bookingsThisMonth >= currentPlan.features.maxBookingsPerMonth ? 'critical' : 'recommended'
        });
      }

      // Feature-based suggestions
      if (!currentPlan.features.analyticsAccess) {
        suggestions.push({
          reason: 'Analytics not available',
          suggestion: 'Upgrade to access detailed analytics and insights',
          urgency: 'optional'
        });
      }

      if (!currentPlan.features.prioritySupport) {
        suggestions.push({
          reason: 'Priority support not available',
          suggestion: 'Upgrade to get priority customer support',
          urgency: 'optional'
        });
      }

      return {
        currentPlan: currentPlan,
        suggestions: suggestions,
        usage: usage
      };
    } catch (error) {
      console.error('Error getting upgrade suggestions:', error);
      return { error: 'Error retrieving upgrade suggestions' };
    }
  }
}

export default new SubscriptionEnforcement();