# E-Commerce Admin Panel

Modern React-based admin panel for managing the e-commerce platform.

## 🎨 Design System

- **Primary Color**: #0e604a
- **Secondary Color**: #f7bd20
- **Background**: #ffffff
- **Text**: #000000
- **Border Radius**: 0px (sharp corners)
- **Font**: Inter

## 🚀 Features Implemented

### Core Features
- ✅ **Authentication** - Login with role-based access
- ✅ **Dashboard** - Statistics, charts, recent orders
- ✅ **Product Management** - Full CRUD with image upload
- ✅ **Order Management** - View and manage orders
- ✅ **Page Builder** - Drag-and-drop page/screen builder

### UI Components
- ✅ Button (Primary, Secondary, Ghost variants)
- ✅ Input with validation
- ✅ Table with pagination
- ✅ Modal
- ✅ Card
- ✅ Sidebar navigation
- ✅ Header with profile menu
- ✅ Layout with responsive sidebar

### State Management
- ✅ Zustand for global state
- ✅ React Query for server state
- ✅ Persistent auth storage

## 📦 Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The admin panel will run on `http://localhost:3000`

## 🔧 Configuration

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## 📁 Project Structure

```
admin-panel/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── index.css          # Global styles with design system
│   ├── components/
│   │   └── common/
│   │       ├── Button.jsx         # Button component
│   │       ├── Input.jsx          # Input component
│   │       ├── Table.jsx          # Table component
│   │       ├── Modal.jsx          # Modal component
│   │       ├── Card.jsx           # Card component
│   │       ├── Sidebar.jsx        # Navigation sidebar
│   │       ├── Header.jsx         # Top header
│   │       └── Layout.jsx         # Main layout
│   ├── pages/
│   │   ├── Dashboard.jsx          # Dashboard with stats
│   │   ├── LoginPage.jsx          # Login page
│   │   ├── ProductsPage.jsx       # Products listing
│   │   ├── ProductForm.jsx        # Product create/edit
│   │   ├── OrdersPage.jsx         # Orders listing
│   │   └── PageBuilder.jsx        # Page builder
│   ├── services/
│   │   └── api.js                 # API service layer
│   ├── store/
│   │   └── index.js               # Zustand stores
│   ├── App.jsx                    # Main app with routing
│   └── main.jsx                   # Entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Usage

### Login

Default credentials (from seeded database):
- **Email**: admin@ecommerce.com
- **Password**: Admin123!

### Managing Products

1. Navigate to "Products" from sidebar
2. Click "Add Product" to create new
3. Fill in product details:
   - Basic info (SKU, name, description)
   - Pricing (regular and sale price)
   - Inventory (stock quantity)
   - Categories and tags
   - Upload images (auto-processed)
4. Save product

### Bulk Editing

1. Go to Products page
2. Click "Bulk Edit"
3. Select multiple products
4. Apply changes to all selected

### Page Builder

1. Navigate to "Page Builder"
2. Choose builder type (Web or App)
3. Drag components from left panel
4. Configure properties in right panel
5. Save page

The builder generates JSON that can be consumed by:
- React frontend (for web pages)
- Flutter app (for mobile screens)

## 🔌 API Integration

All API calls go through the service layer in `src/services/api.js`.

Example:
```javascript
import { productsAPI } from '@/services/api';

// Get all products
const products = await productsAPI.getAll({ page: 1, limit: 20 });

// Create product
const newProduct = await productsAPI.create(productData);
```

## 🎨 Using Design System

### Buttons

```jsx
import Button from '@/components/common/Button';

<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button loading>Loading...</Button>
```

### Inputs

```jsx
import Input from '@/components/common/Input';

<Input
  label="Product Name"
  required
  error="This field is required"
  fullWidth
/>
```

### Cards

```jsx
import Card from '@/components/common/Card';

<Card 
  title="Card Title"
  subtitle="Card subtitle"
  actions={<Button>Action</Button>}
>
  Card content
</Card>
```

## 📊 State Management

### Auth Store

```javascript
import { useAuthStore } from '@/store';

const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
```

### UI Store

```javascript
import { useUIStore } from '@/store';

const { sidebarOpen, toggleSidebar } = useUIStore();
```

### Page Builder Store

```javascript
import { usePageBuilderStore } from '@/store';

const { 
  sections, 
  addSection, 
  updateSection,
  deleteSection 
} = usePageBuilderStore();
```

## 🚧 Pages To Be Implemented

The following pages have placeholder routes and need implementation:

- **Customers Page** - Customer list and management
- **Laybyes Page** - Installment payment tracking
- **Loyalty Points Page** - Points management
- **Coupons Page** - Coupon creation and management
- **Gift Cards Page** - Gift card management
- **Reviews Page** - Review moderation
- **Currencies Page** - Currency settings
- **Email Templates Page** - Email template editor
- **Code Snippets Page** - Code injection manager
- **Import/Export Page** - CSV import/export interface
- **Image Manager Page** - Watermark configuration
- **Settings Page** - Global settings

## 🔨 Building for Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

The build output will be in the `dist` folder.

## 🎨 Customizing Design

### Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    DEFAULT: '#0e604a',
    // ... other shades
  },
  secondary: {
    DEFAULT: '#f7bd20',
    // ... other shades
  },
}
```

### Styles

Global styles in `src/assets/styles/index.css` follow the design system.

## 📱 Responsive Design

The admin panel is fully responsive:
- Desktop: Full sidebar
- Mobile: Collapsible sidebar
- Tablet: Optimized layout

## 🐛 Troubleshooting

### API Connection Issues

1. Verify backend is running on `http://localhost:5000`
2. Check VITE_API_URL in `.env`
3. Check CORS settings in backend

### Build Errors

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Vite cache: `rm -rf node_modules/.vite`

## 📚 Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Recharts** - Charts
- **React Beautiful DnD** - Drag and drop
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

## 🚀 Next Steps

1. Implement remaining pages (see list above)
2. Add more chart types to dashboard
3. Implement advanced product features:
   - Variations manager
   - Price rules manager
   - Bulk operations
4. Add export functionality
5. Implement real-time updates with WebSockets
6. Add dark mode support
7. Implement advanced search and filters

## 📖 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Implementation Guide](../docs/IMPLEMENTATION_GUIDE.md)

---

Built with ❤️ for enterprise e-commerce management
