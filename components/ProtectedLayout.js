import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';

/**
 * ProtectedLayout combines Layout with ProtectedRoute for convenience
 * @param {Object} props
 * @param {Array} props.allowedRoles - Array of roles allowed to access this page (e.g., ['customer'], ['company'], ['admin'])
 * @param {React.ReactNode} props.children - The page content
 * @param {string} props.title - Optional page title for the Layout
 */
export default function ProtectedLayout({ allowedRoles = [], children, ...layoutProps }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout {...layoutProps}>
        {children}
      </Layout>
    </ProtectedRoute>
  );
}