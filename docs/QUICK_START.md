# Quick Start Guide

Get your e-commerce platform up and running in minutes!

## Prerequisites

- Node.js v16 or higher
- MongoDB v5 or higher
- npm or yarn
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ecommerce-platform
```

### 2. Install Dependencies

```bash
# Install all dependencies (backend + admin)
npm run install:all

# Or install individually
cd backend && npm install
cd ../admin-panel && npm install
```

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce_dev
JWT_SECRET=your_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Start MongoDB

```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# On Windows
# MongoDB should start automatically after installation
```

### 5. Seed Database (Optional but Recommended)

```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin@ecommerce.com` / `Admin123!`
- Shop Manager: `manager@ecommerce.com` / `Manager123!`
- Customer: `customer@example.com` / `Customer123!`
- Sample products and categories
- Default currencies
- Email templates

### 6. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run at `http://localhost:5000`

### 7. Configure Admin Panel

```bash
cd admin-panel
cp .env.example .env
```

Edit `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 8. Start Admin Panel

```bash
cd admin-panel
npm start
```

Admin panel will open at `http://localhost:3000`

### 9. Login

Navigate to `http://localhost:3000` and login with:
- Email: `admin@ecommerce.com`
- Password: `Admin123!`

## Quick Test

### Test API

```bash
# Health check
curl http://localhost:5000/health

# Get products
curl http://localhost:5000/api/products

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecommerce.com",
    "password": "Admin123!"
  }'
```

### Test Admin Features

1. **Products**: Navigate to Products → View sample products
2. **Orders**: Check Orders section
3. **Customers**: View customer list
4. **Settings**: Configure currencies, email templates

## Common Issues

### MongoDB Connection Error

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port Already in Use

```bash
# Change PORT in backend/.env
PORT=5001

# Or kill the process using the port
# On Linux/Mac
lsof -ti:5000 | xargs kill -9

# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Email Configuration Issues

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833):
1. Enable 2-Step Verification
2. Generate App Password
3. Use in EMAIL_PASSWORD

## Next Steps

### Customize Your Store

1. **Update Branding**
   - Logo and colors in admin settings
   - Update email templates

2. **Add Products**
   - Manual entry via admin
   - CSV import from WooCommerce

3. **Configure Payment**
   - Add Stripe/PayPal credentials
   - Test payment flow

4. **Setup Email**
   - Configure SMTP
   - Test email templates

5. **Configure Shipping**
   - Add shipping methods
   - Set shipping zones

### Development

```bash
# Watch for changes (backend)
cd backend
npm run dev

# Watch for changes (admin)
cd admin-panel
npm start
```

### Build for Production

```bash
# Backend
cd backend
NODE_ENV=production npm start

# Admin Panel
cd admin-panel
npm run build
# Serve the build folder
```

## API Endpoints

All API endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update status (Admin)

### More endpoints available in API documentation

## Documentation

- [Complete README](../README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)

## Support

- Check the [Issues](https://github.com/yourrepo/issues) page
- Email: support@yourstore.com
- Documentation: https://docs.yourstore.com

## Tips

1. **Keep .env secure** - Never commit to version control
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Regular backups** - Backup MongoDB regularly
4. **Monitor logs** - Check `pm2 logs` in production
5. **Update dependencies** - Keep packages up to date

## What's Included

✅ Complete backend API
✅ Admin panel UI
✅ User authentication
✅ Product management
✅ Order processing
✅ Multi-currency support
✅ Loyalty points system
✅ Laybye/installment payments
✅ Gift cards & coupons
✅ Email system
✅ CSV import/export
✅ Image processing
✅ Page builder
✅ Flutter API support

## Need Help?

1. Check documentation
2. Search existing issues
3. Create a new issue with:
   - Your environment (OS, Node version, MongoDB version)
   - Steps to reproduce
   - Error messages
   - Screenshots if applicable

Happy selling! 🚀
