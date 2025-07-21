-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN subscriptionStatus ENUM('inactive', 'trial', 'active', 'cancelled', 'expired') DEFAULT 'inactive' COMMENT 'Current subscription status for company users';
ALTER TABLE users ADD COLUMN subscriptionPlan VARCHAR(255) DEFAULT NULL COMMENT 'Current subscription plan ID';
ALTER TABLE users ADD COLUMN subscriptionStartDate DATETIME DEFAULT NULL COMMENT 'Subscription start date';
ALTER TABLE users ADD COLUMN subscriptionEndDate DATETIME DEFAULT NULL COMMENT 'Subscription end date';
ALTER TABLE users ADD COLUMN trialEndDate DATETIME DEFAULT NULL COMMENT 'Trial period end date';
ALTER TABLE users ADD COLUMN subscriptionFeatures JSON DEFAULT NULL COMMENT 'JSON object containing subscription features and limits';

-- Create subscriptions table
CREATE TABLE subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  planId VARCHAR(255) NOT NULL COMMENT 'Subscription plan identifier',
  planName VARCHAR(255) NOT NULL COMMENT 'Human readable plan name',
  status ENUM('active', 'inactive', 'cancelled', 'expired', 'trial') DEFAULT 'trial' COMMENT 'Current subscription status',
  billingCycle ENUM('monthly', 'yearly') DEFAULT 'monthly' COMMENT 'Billing frequency',
  price DECIMAL(10, 2) NOT NULL COMMENT 'Subscription price per billing cycle',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT 'Currency code',
  startDate DATETIME NOT NULL COMMENT 'Subscription start date',
  endDate DATETIME NOT NULL COMMENT 'Subscription end date',
  trialEndDate DATETIME DEFAULT NULL COMMENT 'Trial period end date',
  nextBillingDate DATETIME DEFAULT NULL COMMENT 'Next billing date',
  maxPackages INT NOT NULL DEFAULT 0 COMMENT 'Maximum number of packages allowed',
  maxBookingsPerMonth INT NOT NULL DEFAULT 0 COMMENT 'Maximum bookings per month',
  maxPhotosPerPackage INT NOT NULL DEFAULT 0 COMMENT 'Maximum photos per package',
  prioritySupport BOOLEAN DEFAULT FALSE COMMENT 'Whether priority support is included',
  featuredListings BOOLEAN DEFAULT FALSE COMMENT 'Whether featured listings are included',
  analyticsAccess BOOLEAN DEFAULT FALSE COMMENT 'Whether analytics access is included',
  stripeSubscriptionId VARCHAR(255) DEFAULT NULL COMMENT 'Stripe subscription ID if using Stripe',
  stripeCustomerId VARCHAR(255) DEFAULT NULL COMMENT 'Stripe customer ID if using Stripe',
  lastPaymentDate DATETIME DEFAULT NULL COMMENT 'Last successful payment date',
  lastPaymentAmount DECIMAL(10, 2) DEFAULT NULL COMMENT 'Last payment amount',
  failedPaymentAttempts INT DEFAULT 0 COMMENT 'Number of failed payment attempts',
  adminNotes TEXT DEFAULT NULL COMMENT 'Admin notes about the subscription',
  createdBy INT DEFAULT NULL COMMENT 'Admin who created/modified the subscription',
  modifiedBy INT DEFAULT NULL COMMENT 'Admin who last modified the subscription',
  cancelledAt DATETIME DEFAULT NULL COMMENT 'Date when subscription was cancelled',
  cancelledBy INT DEFAULT NULL COMMENT 'Who cancelled the subscription',
  cancellationReason TEXT DEFAULT NULL COMMENT 'Reason for cancellation',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (modifiedBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (cancelledBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_companyId (companyId),
  INDEX idx_status (status),
  INDEX idx_planId (planId),
  INDEX idx_endDate (endDate),
  INDEX idx_nextBillingDate (nextBillingDate)
);