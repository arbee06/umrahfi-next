import '@/styles/globals.css';
import '@/styles/home.css';
import '@/styles/login.css';
import '@/styles/register.css';
import '@/styles/packages.css';
import '@/styles/forgot-password.css';
import '@/styles/reset-password.css';
import '@/styles/package-details.css'
import '@/styles/package-reviews.css'
import '@/styles/company-dashboard.css'
import '@/styles/company-orders.css'
import '@/styles/company-packages.css'
import '@/styles/company-packages-create.css'
import '@/styles/company-order-details.css'
import '@/styles/company-profile.css';

import '@/styles/package-details-gallery.css'
import '@/styles/package-gallery-modal.css'
import '@/styles/package-image-upload.css'
import '@/styles/template-styles.css'
import '@/styles/company-template-management.css'

import '@/styles/customer-profile.css';
import '@/styles/customer-dashboard.css'
import '@/styles/customer-order-details.css'
import '@/styles/customer-booking.css'
import '@/styles/customer-review.css'
import '@/styles/company-public-profile.css'
import '@/styles/admin-dashboard.css'
import '@/styles/fontawesome-custom.css'
import '@/styles/date-range-picker.css'
import '@/styles/date-range-picker-inline.css'
import { AuthProvider } from '@/utils/AuthContext';
import { StripeProvider } from '@/context/StripeContext';
import '@/lib/fontawesome';
import '@fortawesome/fontawesome-svg-core/styles.css';
import '@/utils/axiosConfig';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <StripeProvider>
        <Component {...pageProps} />
      </StripeProvider>
    </AuthProvider>
  );
}