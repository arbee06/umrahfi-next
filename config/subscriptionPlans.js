const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Trial',
    description: 'Perfect for companies just starting out',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 30,
    features: {
      maxPackages: 3,
      maxBookingsPerMonth: 10,
      maxPhotosPerPackage: 5,
      prioritySupport: false,
      featuredListings: false,
      analyticsAccess: false,
      customBranding: false,
      apiAccess: false
    },
    limits: {
      maxPackages: 3,
      maxBookingsPerMonth: 10,
      maxPhotosPerPackage: 5,
      maxCompanyDocuments: 5,
      maxStaffAccounts: 1
    },
    color: '#6b7280',
    icon: 'gift',
    popular: false,
    order: 1
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential features for growing companies',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 14,
    features: {
      maxPackages: 10,
      maxBookingsPerMonth: 50,
      maxPhotosPerPackage: 15,
      prioritySupport: false,
      featuredListings: false,
      analyticsAccess: true,
      customBranding: false,
      apiAccess: false
    },
    limits: {
      maxPackages: 10,
      maxBookingsPerMonth: 50,
      maxPhotosPerPackage: 15,
      maxCompanyDocuments: 20,
      maxStaffAccounts: 3
    },
    color: '#3b82f6',
    icon: 'rocket',
    popular: false,
    order: 2
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for established companies',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 14,
    features: {
      maxPackages: 50,
      maxBookingsPerMonth: 200,
      maxPhotosPerPackage: 30,
      prioritySupport: true,
      featuredListings: true,
      analyticsAccess: true,
      customBranding: true,
      apiAccess: true
    },
    limits: {
      maxPackages: 50,
      maxBookingsPerMonth: 200,
      maxPhotosPerPackage: 30,
      maxCompanyDocuments: 100,
      maxStaffAccounts: 10
    },
    color: '#10b981',
    icon: 'star',
    popular: true,
    order: 3
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited features for large organizations',
    price: 199,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 14,
    features: {
      maxPackages: -1, // Unlimited
      maxBookingsPerMonth: -1, // Unlimited
      maxPhotosPerPackage: -1, // Unlimited
      prioritySupport: true,
      featuredListings: true,
      analyticsAccess: true,
      customBranding: true,
      apiAccess: true
    },
    limits: {
      maxPackages: -1, // Unlimited
      maxBookingsPerMonth: -1, // Unlimited
      maxPhotosPerPackage: -1, // Unlimited
      maxCompanyDocuments: -1, // Unlimited
      maxStaffAccounts: -1 // Unlimited
    },
    color: '#7c3aed',
    icon: 'crown',
    popular: false,
    order: 4
  }
};

// Yearly pricing (20% discount)
const YEARLY_PLANS = {
  basic: {
    ...SUBSCRIPTION_PLANS.basic,
    price: 232, // $29 * 12 * 0.8 = $278.40 rounded to $232
    billingCycle: 'yearly',
    savings: 20
  },
  professional: {
    ...SUBSCRIPTION_PLANS.professional,
    price: 758, // $79 * 12 * 0.8 = $758.40 rounded to $758
    billingCycle: 'yearly',
    savings: 20
  },
  enterprise: {
    ...SUBSCRIPTION_PLANS.enterprise,
    price: 1912, // $199 * 12 * 0.8 = $1912.32 rounded to $1912
    billingCycle: 'yearly',
    savings: 20
  }
};

// Helper functions
const getSubscriptionPlan = (planId) => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

const getYearlyPlan = (planId) => {
  return YEARLY_PLANS[planId] || null;
};

const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS).sort((a, b) => a.order - b.order);
};

const getPlansForBilling = (billingCycle = 'monthly') => {
  if (billingCycle === 'yearly') {
    return Object.values(YEARLY_PLANS).sort((a, b) => a.order - b.order);
  }
  return getAllPlans();
};

const validateSubscriptionLimits = (plan, usage) => {
  const limits = plan.limits;
  const violations = [];

  // Check package limit
  if (limits.maxPackages !== -1 && usage.packages > limits.maxPackages) {
    violations.push({
      type: 'packages',
      limit: limits.maxPackages,
      current: usage.packages,
      message: `Package limit exceeded. Maximum allowed: ${limits.maxPackages}`
    });
  }

  // Check monthly bookings limit
  if (limits.maxBookingsPerMonth !== -1 && usage.bookingsThisMonth > limits.maxBookingsPerMonth) {
    violations.push({
      type: 'bookings',
      limit: limits.maxBookingsPerMonth,
      current: usage.bookingsThisMonth,
      message: `Monthly bookings limit exceeded. Maximum allowed: ${limits.maxBookingsPerMonth}`
    });
  }

  // Check photos per package limit
  if (limits.maxPhotosPerPackage !== -1 && usage.maxPhotosInPackage > limits.maxPhotosPerPackage) {
    violations.push({
      type: 'photos',
      limit: limits.maxPhotosPerPackage,
      current: usage.maxPhotosInPackage,
      message: `Photos per package limit exceeded. Maximum allowed: ${limits.maxPhotosPerPackage}`
    });
  }

  return {
    valid: violations.length === 0,
    violations
  };
};

const canAccessFeature = (plan, feature) => {
  return plan.features[feature] === true;
};

const isUnlimited = (value) => {
  return value === -1;
};

const formatLimit = (value) => {
  return isUnlimited(value) ? 'Unlimited' : value.toLocaleString();
};

module.exports = {
  SUBSCRIPTION_PLANS,
  YEARLY_PLANS,
  getSubscriptionPlan,
  getYearlyPlan,
  getAllPlans,
  getPlansForBilling,
  validateSubscriptionLimits,
  canAccessFeature,
  isUnlimited,
  formatLimit
};