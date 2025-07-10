import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';

export default function StripePaymentForm({ amount, orderId, packageId, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    
    // Get card details for confirmation
    const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (cardError) {
      onError(cardError.message);
      return;
    }

    const { card } = paymentMethod;
    const cardDetails = `**** **** **** ${card.last4}`;
    const expiryDate = `${card.exp_month.toString().padStart(2, '0')}/${card.exp_year.toString().slice(2)}`;

    // Show confirmation dialog with card details
    const result = await Swal.fire({
      title: 'Confirm Payment',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">Amount to pay:</p>
          <p style="font-weight: 700; font-size: 1.5rem; color: #1f2937; margin-bottom: 1rem;">$${amount}</p>
          
          <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border-left: 4px solid #3b82f6;">
            <p style="color: #374151; margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.9rem;">Payment Card:</p>
            <p style="color: #1f2937; margin: 0 0 0.25rem 0; font-family: monospace; font-size: 0.9rem;">${cardDetails}</p>
            <p style="color: #6b7280; margin: 0; font-size: 0.85rem;">Expires: ${expiryDate} • ${card.brand.toUpperCase()}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Your payment will be processed securely through Stripe. You will receive a confirmation email once the payment is completed.</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Process Payment',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-html',
        confirmButton: 'custom-swal-confirm',
        cancelButton: 'custom-swal-cancel'
      },
      buttonsStyling: false,
      focusConfirm: false,
      focusCancel: true
    });

    if (!result.isConfirmed) return;

    // Play action sound when confirming
    soundManager.playAction();

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
          ...(orderId && { orderId }), // Only include orderId if it exists
          ...(packageId && { packageId }) // Include packageId for company-specific Stripe configuration
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
        // Play success sound when payment is successful
        soundManager.playLogin();
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