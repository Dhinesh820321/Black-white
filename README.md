# Multi-Branch Salon Management System

A production-ready, SaaS-ready salon management system with multi-branch support, geo-fencing, real-time updates, and comprehensive business analytics.

## Features

### Core Features
- **Multi-Branch Management** - CRUD operations with geo-coordinates
- **Employee Management** - Role-based access (Admin, Manager, Stylist, Helper)
- **Smart Login with Geo-Fencing** - Haversine formula for location verification
- **Attendance System** - Check-in/Check-out with GPS tracking
- **Payment Tracking** - UPI, Cash, Card with analytics
- **Expense Management** - Categorized expenses with receipts
- **Inventory Management** - Stock tracking with low-stock alerts
- **Invoice Generation** - GST-aware billing system
- **Customer Management** - Loyalty points and retention alerts

### Advanced Features
- **Real-time Updates** - Socket.IO integration
- **Offline Support** - Local storage with sync capability
- **Export Reports** - CSV export functionality
- **Dashboard Analytics** - Revenue charts, payment splits
- **API Documentation** - Swagger UI included

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO

## Project Structure

```
salon-management/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & app config
│   │   ├── controllers/      # Business logic
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helpers (geofencing, responses)
│   │   └── server.js        # Entry point
│   ├── uploads/             # File uploads
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   └── utils/           # Helper functions
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE salon_management;

# The schema will be created automatically on server start
```

### 2. Backend Setup

```bash
cd salon-management/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=salon_management
# JWT_SECRET=your-secret-key

# Start server (will auto-create tables)
npm run dev
```

### 3. Frontend Setup

```bash
cd salon-management/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

## Default Credentials

After first setup, create an admin user:

```bash
# Use the registration endpoint or create via SQL
INSERT INTO employees (name, role, phone, password, status) 
VALUES ('Admin', 'admin', '9999999999', '$2a$10$...', 'active');
```

Then login with:
- **Phone**: 9999999999
- **Password**: admin123 (change after first login)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with GPS
- `POST /api/auth/register` - Register employee
- `GET /api/auth/profile` - Get profile

### Branches
- `GET /api/branches` - List branches
- `POST /api/branches` - Create branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `POST /api/attendance/check-in` - Check in with GPS
- `POST /api/attendance/check-out` - Check out with GPS
- `GET /api/attendance/today` - Today's attendance

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/daily-revenue` - Daily revenue

### Dashboard
- `GET /api/dashboard` - Dashboard stats
- `GET /api/dashboard/revenue-chart` - Revenue chart data

## Role-Based Access

| Feature | Admin | Manager | Stylist | Helper |
|---------|-------|---------|---------|--------|
| All Branches | ✓ | ✗ | ✗ | ✗ |
| Manage Branches | ✓ | ✗ | ✗ | ✗ |
| Manage Employees | ✓ | ✓ | ✗ | ✗ |
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| Check In/Out | ✓ | ✓ | ✓ | ✓ |
| Create Invoices | ✓ | ✓ | ✓ | ✗ |
| Manage Inventory | ✓ | ✓ | ✗ | ✗ |
| View Reports | ✓ | ✓ | ✓ | ✗ |

## Geo-Fencing

The system uses the Haversine formula to calculate distance between user location and branch coordinates:

```javascript
// Distance in meters
const distance = haversineDistance(lat1, lon1, lat2, lon2);

// Check if within radius
const isAllowed = distance <= geoRadius;
```

Login is blocked if user is outside the assigned branch radius.

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=salon_management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Database Schema

### Tables
- `branches` - Salon locations with geo-coordinates
- `employees` - Staff with roles and branch assignments
- `attendance` - Check-in/check-out records
- `customers` - Client database
- `services` - Offered services with pricing
- `invoices` - Billing records
- `invoice_items` - Line items for invoices
- `payments` - Payment transactions
- `expenses` - Branch expenses
- `inventory` - Stock items
- `inventory_usage` - Usage tracking
- `notifications` - System alerts

## Real-time Features

Socket.IO is integrated for:
- Live dashboard updates
- Attendance notifications
- Low stock alerts
- Payment confirmations

## Security Features

- JWT authentication
- Password hashing (bcrypt)
- Role-based access control
- SQL injection prevention
- Input validation
- CORS enabled

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure SSL/TLS
4. Set up database backups
5. Use PM2 or similar for process management

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from backend
# Update server.js to serve dist folder
```

## License

MIT License

## Support

For issues and feature requests, please open an issue on GitHub.
