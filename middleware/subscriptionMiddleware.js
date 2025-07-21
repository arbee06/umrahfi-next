import subscriptionEnforcement from '@/utils/subscriptionEnforcement';

/**
 * Middleware to enforce subscription limits
 * This middleware checks subscription limits before allowing actions
 */

/**
 * Check if user can perform a specific action based on their subscription
 * @param {string} action - The action to check
 * @param {Object} options - Additional options
 * @returns {Function} - Middleware function
 */
export function checkSubscriptionLimit(action, options = {}) {
  return async (req, res, next) => {
    try {
      // Skip check for non-company users
      if (!req.user || req.user.role !== 'company') {
        return next();
      }

      const companyId = req.user.id;
      const result = await subscriptionEnforcement.checkActionAllowed(companyId, action, options);

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Subscription limit exceeded',
          message: result.reason,
          subscriptionStatus: result.subscriptionStatus,
          limit: result.limit,
          current: result.current,
          feature: result.feature,
          planName: result.planName,
          upgradeRequired: true
        });
      }

      // Add usage info to request for logging/analytics
      req.subscriptionUsage = {
        limit: result.limit,
        current: result.current,
        action: action
      };

      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error checking subscription limits'
      });
    }
  };
}

/**
 * Middleware to check package creation limits
 */
export const checkPackageLimit = checkSubscriptionLimit('create_package');

/**
 * Middleware to check booking creation limits
 */
export const checkBookingLimit = checkSubscriptionLimit('create_booking');

/**
 * Middleware to check photo upload limits
 */
export function checkPhotoLimit(packageId) {
  return checkSubscriptionLimit('upload_photos', { packageId });
}

/**
 * Middleware to check analytics access
 */
export const checkAnalyticsAccess = checkSubscriptionLimit('access_analytics');

/**
 * Middleware to check priority support access
 */
export const checkPrioritySupportAccess = checkSubscriptionLimit('priority_support');

/**
 * Middleware to check featured listings access
 */
export const checkFeaturedListingsAccess = checkSubscriptionLimit('featured_listings');

/**
 * Middleware to add subscription status to response
 */
export function addSubscriptionStatus() {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.role === 'company') {
        const status = await subscriptionEnforcement.getSubscriptionStatus(req.user.id);
        req.subscriptionStatus = status;
      }
      next();
    } catch (error) {
      console.error('Error getting subscription status:', error);
      next(); // Don't block request if status check fails
    }
  };
}

/**
 * Utility function to get subscription warnings for a company
 * @param {number} companyId - Company ID
 * @returns {Object} - Subscription warnings
 */
export async function getSubscriptionWarnings(companyId) {
  try {
    const status = await subscriptionEnforcement.getSubscriptionStatus(companyId);
    return {
      warnings: status.warnings || [],
      subscriptionStatus: status.status,
      planName: status.plan?.name,
      subscriptionEndDate: status.subscriptionEndDate,
      trialEndDate: status.trialEndDate
    };
  } catch (error) {
    console.error('Error getting subscription warnings:', error);
    return {
      warnings: [],
      error: 'Error retrieving subscription status'
    };
  }
}

/**
 * Utility function to get upgrade suggestions
 * @param {number} companyId - Company ID
 * @returns {Object} - Upgrade suggestions
 */
export async function getUpgradeSuggestions(companyId) {
  try {
    return await subscriptionEnforcement.getUpgradeSuggestions(companyId);
  } catch (error) {
    console.error('Error getting upgrade suggestions:', error);
    return {
      error: 'Error retrieving upgrade suggestions'
    };
  }
}