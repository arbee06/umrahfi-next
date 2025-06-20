# Umrahfi - Umrah Package Booking Platform

A Next.js application for booking Umrah packages with three user types: Customers, Companies, and Admins.

## Features

### Customer Features
- Browse available Umrah packages
- Filter packages by price and date
- View detailed package information
- Book packages with traveler details
- View booking history and status

### Company Features  
- Create and manage Umrah packages
- Set package details (price, dates, inclusions, etc.)
- View and manage customer bookings
- Update order status

### Admin Features
- Monitor all users, packages, and orders
- View dashboard with statistics
- Manage user accounts (activate/deactivate)
- Oversee platform operations

## Tech Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with secure cookies
- **Styling**: CSS with responsive design

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create `.env.local` file with:
```
MONGODB_URI=mongodb://localhost:27017/umrahfi
JWT_SECRET=your-secret-key-here-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

4. Visit `http://localhost:3000` to view the application

### First Admin Setup

To create the first admin user, you can modify the registration endpoint temporarily or use MongoDB directly:

```javascript
// In MongoDB shell or compass
use umrahfi
db.users.insertOne({
  name: "Admin User",
  email: "admin@umrahfi.com", 
  password: "$2a$10$hashedpassword", // Use bcryptjs to hash
  role: "admin",
  isActive: true,
  createdAt: new Date()
})
```

## Project Structure

```
├── components/          # Reusable React components
├── lib/                # Database connection
├── middleware/         # Authentication middleware
├── models/             # MongoDB schemas
├── pages/              # Next.js pages and API routes
│   ├── api/           # Backend API endpoints
│   ├── admin/         # Admin dashboard pages
│   ├── company/       # Company dashboard pages
│   ├── customer/      # Customer dashboard pages
│   └── packages/      # Package browsing pages
├── services/          # Frontend API service classes
├── styles/            # CSS stylesheets
└── utils/             # Utility functions and contexts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Packages
- `GET /api/packages` - Get packages (with filters)
- `POST /api/packages` - Create package (company/admin)
- `GET /api/packages/[id]` - Get package details
- `PUT /api/packages/[id]` - Update package (company/admin)
- `DELETE /api/packages/[id]` - Delete package (company/admin)

### Orders
- `GET /api/orders` - Get orders (filtered by role)
- `POST /api/orders` - Create order (customer)
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status (company/admin)

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get users with filters
- `PUT /api/admin/users` - Update user details

## Security Features

- JWT authentication with HttpOnly cookies
- Role-based access control
- Password hashing with bcryptjs
- Input validation and sanitization
- Protected routes on frontend and backend

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database Models

#### User Model
- Customer, Company, and Admin roles
- Company-specific fields (name, license, address)
- Authentication and profile data

#### Package Model  
- Complete Umrah package details
- Pricing, dates, and availability
- Inclusions, exclusions, and itinerary
- Hotel and transportation information

#### Order Model
- Booking details with traveler information
- Payment and status tracking
- Relationship to customer, company, and package

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.