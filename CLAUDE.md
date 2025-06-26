# Project Guidelines for Claude

## Required Imports for All Pages

Every page MUST include these essential imports:

```javascript
import Icon from '@/components/FontAwesome';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
```

## Font Awesome Icons

**NEVER use Unicode emojis.** Always use Font Awesome icons for consistency and accessibility:

```javascript
// ✅ Correct - Use Font Awesome
<Icon icon={['fas', 'star']} />
<Icon icon={['fas', 'user']} className="custom-class" />
<Icon icon={['fas', 'building']} spin />

// ❌ Wrong - Never use emojis
<span>🌟</span>
<span>👥</span>
```

Common icon mappings:
- `🌟` → `<Icon icon={['fas', 'star']} />`
- `🏢` → `<Icon icon={['fas', 'building']} />`
- `👥` → `<Icon icon={['fas', 'users']} />`
- `📦` → `<Icon icon={['fas', 'box']} />`
- `📋` → `<Icon icon={['fas', 'clipboard-list']} />`
- `🕌` → Use emoji ONLY for brand logo, Font Awesome doesn't have mosque icon
- `⚡` → `<Icon icon={['fas', 'bolt']} />`
- `🕐` → `<Icon icon={['fas', 'clock']} />`
- `🎉` → `<Icon icon={['fas', 'check-circle']} />`

## Authentication Pattern

This project uses cookie-based authentication, NOT localStorage tokens.

### For Protected Pages

Always wrap pages with `ProtectedRoute` and `Layout`:

```javascript
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';

export default function SomePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout>
        {/* Page content */}
      </Layout>
    </ProtectedRoute>
  );
}
```

Available roles:
- `['customer']` - Customer pages only
- `['company']` - Company pages only
- `['admin']` - Admin pages only
- `['customer', 'company']` - Both customer and company
- `[]` - Any authenticated user

### API Authentication

APIs use cookie authentication via the `authMiddleware`:

```javascript
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  // Apply auth middleware
  const authResult = await authMiddleware([])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  // Your API logic here
  const userId = authResult.user.id;
}
```

### Important Notes

1. NEVER use `localStorage.getItem('token')` - we use cookies
2. NEVER add Authorization headers to fetch requests - cookies are sent automatically
3. Always use `ProtectedLayout` instead of manually checking authentication
4. Always use optional chaining (`user?.property`) when accessing user properties in JSX to handle SSR/loading states
5. The `useAuth()` hook provides:
   - `user` - Current user object
   - `setUser` - Update user state
   - `loading` - Auth loading state
   - `isAuthenticated` - Boolean if user is logged in
   - `login`, `logout`, `register` - Auth methods

## File Naming Conventions

- Components: PascalCase (e.g., `ProtectedLayout.js`)
- Pages: kebab-case (e.g., `customer-profile.js`)
- Styles: kebab-case (e.g., `customer-profile.css`)
- API routes: kebab-case (e.g., `update-profile.js`)

## CSS Class Naming

Use unique prefixes to avoid conflicts:
- Customer pages: `customer-profile-*`, `customer-dash-*`
- Company pages: `company-profile-*`, `company-dash-*`
- Admin pages: `admin-*`
- Shared components: `umrahfi-*`

## User Feedback Pattern

Use SweetAlert2 with sound alerts for user actions:

```javascript
import Swal from 'sweetalert2';
import soundManager from '@/utils/soundUtils';

// Success with redirect
soundManager.playLogin(); // Success sound
await Swal.fire({
  title: 'Success!',
  html: 'Operation completed successfully',
  icon: 'success',
  confirmButtonColor: '#059669',
  confirmButtonText: 'Continue',
  timer: 3000,
  timerProgressBar: true
});
router.push('/dashboard');

// Toast notifications
soundManager.playAction(); // Action sound
Swal.fire({
  title: 'Updated!',
  text: 'Changes saved successfully',
  icon: 'success',
  timer: 3000,
  timerProgressBar: true,
  toast: true,
  position: 'top-end',
  showConfirmButton: false
});

// Loading state
Swal.fire({
  title: 'Processing...',
  html: 'Please wait...',
  allowOutsideClick: false,
  allowEscapeKey: false,
  showConfirmButton: false,
  didOpen: () => Swal.showLoading()
});
```

Available sounds:
- `soundManager.playLogin()` - Success/completion sounds
- `soundManager.playAction()` - General action sounds

## Page Creation Checklist

When creating any new page, ALWAYS:

1. **Import Essential Components:**
   ```javascript
   import Icon from '@/components/FontAwesome';
   import ProtectedRoute from '@/components/ProtectedRoute';
   import Layout from '@/components/Layout';
   import { useAuth } from '@/utils/AuthContext';
   ```

2. **Use ProtectedRoute Wrapper:**
   ```javascript
   return (
     <ProtectedRoute allowedRoles={['customer']}>
       <Layout>
         {/* Content */}
       </Layout>
     </ProtectedRoute>
   );
   ```

3. **Apply Unique CSS Classes:**
   - Use page-specific prefixes (`customer-*`, `company-*`, `admin-*`)
   - Create corresponding CSS file with same prefix

4. **Font Awesome Icons Only:**
   - Replace any emojis with Font Awesome icons
   - Exception: `🕌` emoji for brand logo only

5. **User Feedback with SweetAlert2:**
   - Include sound alerts for actions
   - Use consistent success/error patterns

## Header Design Patterns

### Modern Header Structure
All profile pages should use sophisticated headers with:

```javascript
<div className="page-header">
  <div className="page-header-content">
    <div className="page-header-text">
      <div className="page-welcome-badge">
        <Icon icon={['fas', 'icon-name']} className="page-badge-icon" />
        <span className="page-badge-text">Page Title</span>
      </div>
      <h1 className="page-header-title">
        Welcome, <span className="page-name">{user?.name}</span>
      </h1>
      <p className="page-header-subtitle">Page description</p>
    </div>
    <div className="page-header-actions">
      {/* Avatar or action buttons */}
    </div>
  </div>
</div>
```

### CSS Pattern for Headers
```css
.page-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
  border-radius: 2rem;
  padding: 3rem;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.page-welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  animation: glow 2s ease-in-out infinite alternate;
}
```

## Database Updates

When adding new fields to models, remember to:
1. Update the model file (e.g., `/models/User.js`)
2. Create a migration SQL file in `/migrations/`
3. Run the migration against the database

## Testing Commands

Always run these commands after development:
- `npm run lint` - Check code quality
- `npm run typecheck` - TypeScript validation
- Test the functionality manually