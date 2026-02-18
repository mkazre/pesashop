require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Currency = require('../models/Currency');
const { LoyaltySetting } = require('../models/LoyaltyPoint');
const seedEmailTemplates = require('./emailTemplates');

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Currency.deleteMany({});
    await LoyaltySetting.deleteMany({});

    console.log('👤 Creating admin user...');
    const admin = await User.create({
      email: 'admin@ecommerce.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    console.log('👤 Creating shop manager...');
    await User.create({
      email: 'manager@ecommerce.com',
      password: 'Manager123!',
      firstName: 'Shop',
      lastName: 'Manager',
      role: 'shop_manager'
    });

    console.log('👤 Creating test customer...');
    await User.create({
      email: 'customer@example.com',
      password: 'Customer123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      customerGroup: 'retail'
    });

    console.log('📁 Creating categories...');
    const electronics = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      displayOrder: 1
    });

    const clothing = await Category.create({
      name: 'Clothing',
      description: 'Apparel and accessories',
      displayOrder: 2
    });

    const phones = await Category.create({
      name: 'Smartphones',
      description: 'Latest smartphones',
      parent: electronics._id,
      displayOrder: 1
    });

    const laptops = await Category.create({
      name: 'Laptops',
      description: 'Laptops and notebooks',
      parent: electronics._id,
      displayOrder: 2
    });

    console.log('📦 Creating sample products...');
    
    // Create products one by one to ensure SKU auto-generation works
    const product1 = new Product({
      name: 'Premium Smartphone X',
      description: 'Latest flagship smartphone with advanced features',
      shortDescription: 'Flagship smartphone',
      regularPrice: 15999,
      salePrice: 14999,
      stock: 50,
      categories: [electronics._id, phones._id],
      tags: ['smartphone', 'electronics', 'mobile'],
      isFeatured: true,
      images: ['/uploads/products/phone-1.jpg'],
      featuredImage: '/uploads/products/phone-1.jpg'
    });
    await product1.save();
    
    const product2 = new Product({
      name: 'Professional Laptop Pro',
      description: 'High-performance laptop for professionals',
      shortDescription: 'Professional laptop',
      regularPrice: 25999,
      stock: 30,
      categories: [electronics._id, laptops._id],
      tags: ['laptop', 'computer', 'professional'],
      isFeatured: true,
      images: ['/uploads/products/laptop-1.jpg'],
      featuredImage: '/uploads/products/laptop-1.jpg'
    });
    await product2.save();
    
    const product3 = new Product({
      name: 'Classic Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt',
      shortDescription: 'Cotton t-shirt',
      regularPrice: 299,
      salePrice: 249,
      stock: 100,
      categories: [clothing._id],
      tags: ['clothing', 'shirt', 't-shirt'],
      productType: 'simple',
      images: ['/uploads/products/shirt-1.jpg'],
      featuredImage: '/uploads/products/shirt-1.jpg'
    });
    await product3.save();

    console.log('💰 Creating currencies...');
    await Currency.create([
      {
        code: 'ZAR',
        name: 'South African Rand',
        symbol: 'R',
        exchangeRate: 1,
        isBaseCurrency: true
      },
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchangeRate: 0.055
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        exchangeRate: 0.050
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        exchangeRate: 0.043
      }
    ]);

    console.log('🎁 Creating loyalty settings...');
    await LoyaltySetting.create({
      enabled: true,
      pointsPerCurrency: 1,
      redemptionRate: 0.1,
      minRedemptionPoints: 100,
      expiryEnabled: false,
      signupBonus: 100,
      reviewBonus: 50,
      groupMultipliers: [
        { group: 'retail', multiplier: 1 },
        { group: 'wholesale', multiplier: 1.5 },
        { group: 'vip', multiplier: 2 }
      ]
    });

    console.log('📧 Creating email templates...');
    await seedEmailTemplates();

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@ecommerce.com / Admin123!');
    console.log('Manager: manager@ecommerce.com / Manager123!');
    console.log('Customer: customer@example.com / Customer123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
