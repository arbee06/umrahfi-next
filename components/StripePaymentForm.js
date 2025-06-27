import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ amount, orderId, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Get payment intent from your API
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          ...(orderId && { orderId }) // Only include orderId if it exists
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        onError(result.error.message);
      } else {
        onSuccess(result.paymentIntent);
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: '"Inter", sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="customer-book-stripe-payment-form">
      <div className="customer-book-stripe-card-element">
        <CardElement options={cardElementOptions} />
      </div>
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || processing}
        className={`customer-book-btn-primary customer-book-stripe-pay-btn ${processing ? 'processing' : ''}`}
      >
        {processing && (
          <div className="customer-book-btn-spinner"></div>
        )}
        <span>{processing ? 'Processing Payment...' : `Pay $${amount}`}</span>
      </button>
    </div>
  );
}