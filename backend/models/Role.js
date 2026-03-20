const mongoose = require('mongoose');

// All resources that can have CRUD permissions
const RESOURCES = [
  'dashboard',
  'products',
  'categories',
  'orders',
  'customers',
  'laybyes',
  'loyalty',
  'coupons',
  'gift_cards',
  'reviews',
  'questions',
  'currencies',
  'notifications',
  'emails',
  'pages',
  'menus',
  'media',
  'settings',
  'import_export',
  'stats',
  'badges',
  'users',
  'roles',
  'code_snippets',
  'shipping_waybills',
  'shipping_photos',
  'shipping_scanout',
  'shipping_scanin',
  'shipping_pod',
  'shipping_reports',
  'shipping_hubs',
];

const permissionSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
    enum: RESOURCES,
  },
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  permissions: [permissionSchema],
  isSystem: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  userCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Auto-generate slug from name
roleSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  }
  next();
});

roleSchema.statics.RESOURCES = RESOURCES;

module.exports = mongoose.model('Role', roleSchema);
