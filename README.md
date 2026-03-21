# Advanced E-Commerce Platform

A full-featured e-commerce platform built with React.js, Node.js, MongoDB, and React Native API support.

## 🚀 Features

### Core E-Commerce Features
- **Product Management**: Complete CRUD operations with variants, attributes, and pricing rules
- **Order Management**: Full order lifecycle with status tracking
- **Customer Management**: User accounts, addresses, and purchase history
- **Category Management**: Hierarchical category structure
- **Multi-Currency Support**: Automatic exchange rate updates with ZAR as base currency
- **Inventory Management**: Stock tracking with low stock alerts

### Advanced Features

#### B2BKing-Style Pricing (Advanced Pricing Manager)
- Customer group-based pricing (Retail, Wholesale, VIP, Distributor)
- Bulk pricing rules
- BOGO and promotional pricing
- Tiered pricing based on quantity
- Price rules by product, category, or global
- Time-based pricing campaigns

#### Laybye System (Payment Plans)
- Installment payment plans
- Weekly, bi-weekly, or monthly payment schedules
- Automatic payment reminders
- Late payment tracking
- Deposit and installment management

#### Loyalty Points & Rewards
- Points earned on purchases
- Points redemption system
- Customer group multipliers
- Bonus points (signup, birthday, reviews)
- Point expiry management
- Minimum redemption thresholds

#### Gift Cards & Coupons
- Digital gift card generation
- Percentage, fixed amount, and free shipping coupons
- Usage limits and restrictions
- Product and category-specific coupons
- Customer group restrictions
- Stackable coupons option

#### WooCommerce CSV Import/Export
- Import products, categories, customers, and orders
- Duplicate detection before import
- Update existing records option
- Export to CSV for backup
- Field mapping from WooCommerce format

#### Image Processing
- Automatic 1:1 aspect ratio conversion
- Watermark application with position control
- Batch image processing
- Multiple size generation
- Image optimization

#### Currency Management (WOOCS/FOX Features)
- Unlimited currencies
- Automatic exchange rate updates every 6 hours
- Admin always sees ZAR
- Frontend currency switcher
- Historical rate tracking

#### Email System
- Template-based emails
- Order confirmations and updates
- Laybye payment reminders
- Welcome emails
- Password reset
- Gift card delivery
- Bulk email campaigns

#### Drag & Drop Page Builder
- Visual page builder for web
- Visual app screen builder for Flutter
- Dynamic data binding
- Component library
- Version control
- Template system

#### Review System
- Star ratings
- Verified purchase badges
- Helpful/unhelpful voting
- Admin responses
- Image uploads in reviews

#### Code Snippets
- Insert custom code in various locations
- JavaScript, CSS, and HTML support
- Conditional loading by page/role
- Priority-based execution

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT
- **Image Processing**: Sharp
- **Email**: Nodemailer
- **CSV Processing**: csv-parser, csv-writer
- **Scheduling**: node-cron
- **Security**: Helmet, express-rate-limit

### Frontend (Admin Panel)
- **Framework**: React.js
- **State Management**: Redux/Context API
- **Routing**: React Router
- **UI Components**: Material-UI / Custom
- **HTTP Client**: Axios
- **Drag & Drop**: React DnD

### Mobile API Support
- RESTful API designed for Flutter consumption
- JSON-based page/screen structure
- Dynamic content delivery

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-platform
```

2. Install dependencies:
```bash
npm run install:all
```

3. Configure environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB service

5. Initialize currencies and seed data (optional):
```bash
cd backend
npm run seed
```

6. Start the backend:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Admin Panel Setup

1. Navigate to admin panel directory:
```bash
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit with backend API URL
```

4. Start the dev server:
```bash
npm start
```

Admin panel will run on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce_platform

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourstore.com

# Currency API
CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest/ZAR
CURRENCY_UPDATE_INTERVAL=6

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id

# File Upload
MAX_FILE_SIZE=5242880
IMAGE_QUALITY=90
```

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Products

#### Get All Products
```http
GET /api/products?page=1&limit=20&category=<id>&minPrice=100&maxPrice=1000&search=<term>&sortBy=basePrice:asc&currency=USD
```

#### Get Single Product
```http
GET /api/products/:id?currency=USD
```

#### Create Product (Admin/Shop Manager)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Product description",
  "basePrice": 999.99,
  "stockQuantity": 100,
  "categories": ["<category_id>"]
}
```

#### Bulk Update Products
```http
POST /api/products/bulk-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "productIds": ["<id1>", "<id2>"],
  "updates": {
    "salePrice": 899.99
  }
}
```

#### Get Product Price for Customer Group
```http
GET /api/products/:id/price?customerGroup=wholesale&quantity=10&currency=USD
```

### Orders

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "<product_id>",
      "quantity": 2
    }
  ],
  "billingAddress": {...},
  "shippingAddress": {...},
  "paymentMethod": "card"
}
```

### Laybyes

#### Create Laybye Plan
```http
POST /api/laybyes
Authorization: Bearer <token>
Content-Type: application/json

{
  "order": "<order_id>",
  "depositAmount": 500,
  "installmentPlan": {
    "frequency": "monthly",
    "numberOfPayments": 6
  }
}
```

#### Record Payment
```http
POST /api/laybyes/:id/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500,
  "method": "card",
  "transactionId": "TXN123"
}
```

### Loyalty Points

#### Get User Balance
```http
GET /api/loyalty/balance
Authorization: Bearer <token>
```

#### Redeem Points
```http
POST /api/loyalty/redeem
Authorization: Bearer <token>
Content-Type: application/json

{
  "points": 1000,
  "orderId": "<order_id>"
}
```

### Currencies

#### Get Active Currencies
```http
GET /api/currencies
```

#### Convert Price
```http
POST /api/currencies/convert
Content-Type: application/json

{
  "amount": 1000,
  "from": "ZAR",
  "to": "USD"
}
```

### Import/Export

#### Import Products from CSV
```http
POST /api/import/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <csv_file>
allowDuplicates: false
updateExisting: true
```

#### Validate Import
```http
POST /api/import/validate
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <csv_file>
type: products
```

### Images

#### Configure Watermark
```http
POST /api/images/watermark/config
Authorization: Bearer <token>
Content-Type: multipart/form-data

watermark: <image_file>
position: bottom-right
size: 0.2
opacity: 0.7
```

#### Process Image
```http
POST /api/images/process
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <image_file>
```

## 🎨 Page Builder Structure

The page builder outputs JSON structure that can be consumed by both React frontend and Flutter app:

```json
{
  "screen": "home",
  "sections": [
    {
      "type": "hero",
      "components": [
        {
          "type": "heading",
          "text": "{{site.title}}",
          "style": {
            "fontSize": 32,
            "color": "#0e604a"
          }
        },
        {
          "type": "product_carousel",
          "dataSource": "products.featured",
          "limit": 10
        }
      ]
    }
  ]
}
```

## 🔐 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- XSS protection

## 📊 Database Schema

See `/docs/database-schema.md` for detailed schema documentation.

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run admin panel tests
cd admin-panel
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set environment to production
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up process manager (PM2)

```bash
npm install -g pm2
pm2 start server.js --name ecommerce-api
pm2 save
pm2 startup
```

### Admin Panel Deployment

```bash
cd admin-panel
npm run build
# Serve build folder with nginx or hosting service
```

## 📝 License

MIT License

## 👥 Support

For support, email support@pesashop.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Multi-vendor marketplace support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (Flutter)
- [ ] Progressive Web App (PWA)
- [ ] Real-time chat support
- [ ] AI-powered product recommendations
- [ ] Advanced SEO tools
- [ ] Social media integration
- [ ] Subscription products
- [ ] Affiliate program

## 🙏 Acknowledgments

- WooCommerce for inspiration
- B2BKing for pricing features concept
- YITH plugins for gift cards and loyalty concepts
- SUMO for payment plans inspiration
