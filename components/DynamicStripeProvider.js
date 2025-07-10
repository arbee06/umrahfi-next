import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

export default function DynamicStripeProvider({ children, packageId }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!packageId) {
      // Use default Stripe configuration
      const defaultStripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      setStripePromise(defaultStripe);
      setPaymentConfig({
        stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        preferredPaymentMethods: ['stripe', 'bank_transfer'],
        acceptCashPayments: true,
        acceptBankTransfers: true
      });
      setLoading(false);
      return;
    }

    // Fetch company-specific Stripe configuration
    const fetchStripeConfig = async () => {
      try {
        const response = await fetch(`/api/payments/stripe-config?packageId=${packageId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment configuration');
        }

        const data = await response.json();
        const config = data.paymentConfig;

        setPaymentConfig(config);

        // Load Stripe with company-specific key
        if (config.stripePublishableKey) {
          const companyStripe = loadStripe(config.stripePublishableKey);
          setStripePromise(companyStripe);
        } else {
          // Fallback to default if no company key
          const defaultStripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          setStripePromise(defaultStripe);
        }

      } catch (err) {
        console.error('Error fetching Stripe config:', err);
        setError(err.message);
        
        // Fallback to default Stripe
        const defaultStripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        setStripePromise(defaultStripe);
        setPaymentConfig({
          stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          preferredPaymentMethods: ['stripe', 'bank_transfer'],
          acceptCashPayments: true,
          acceptBankTransfers: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStripeConfig();
  }, [packageId]);

  if (loading) {
    return (
      <div className="stripe-loading">
        <div className="stripe-loading-spinner"></div>
        <p>Loading payment configuration...</p>
      </div>
    );
  }

  if (error && !stripePromise) {
    return (
      <div className="stripe-error">
        <p>Error loading payment configuration: {error}</p>
        <p>Please refresh the page or contact support.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      {typeof children === 'function' ? children(paymentConfig) : children}
    </Elements>
  );
}