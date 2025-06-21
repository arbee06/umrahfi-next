import '@/styles/globals.css';
import '@/styles/home.css';
import '@/styles/login.css';
import '@/styles/register.css';
import '@/styles/packages.css';
import '@/styles/package-details.css'
import '@/styles/company-dashboard.css'
import '@/styles/company-orders.css'
import '@/styles/company-packages.css'
import '@/styles/company-packages-create.css'
import '@/styles/company-order-details.css'

import '@/styles/package-details-gallery.css'
import '@/styles/package-gallery-modal.css'
import '@/styles/package-image-upload.css'
import '@/styles/template-styles.css'
import '@/styles/company-template-management.css'

import '@/styles/customer-dashboard.css'
import '@/styles/customer-order-details.css'
import '@/styles/customer-booking.css'
import '@/styles/admin-dashboard.css'
import '@/styles/fontawesome-custom.css'
import { AuthProvider } from '@/utils/AuthContext';
import '@/lib/fontawesome';
import '@fortawesome/fontawesome-svg-core/styles.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}