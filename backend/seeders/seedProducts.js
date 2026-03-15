require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');

const seedProducts = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    
    // Get categories
    const categories = await Category.find({});
    const electronics = categories.find(c => c.name === 'Electronics');
    const clothing = categories.find(c => c.name === 'Clothing');
    
    // Get real product images
    const uploadsDir = path.join(__dirname, '../uploads/products');
    const imageFiles = fs.readdirSync(uploadsDir)
      .filter(file => file.endsWith('.jpg') && !file.startsWith('._'))
      .slice(0, 50); // Take first 50 images
    
    console.log(`📁 Found ${imageFiles.length} product images`);
    
    // Sample product data based on image names
    const sampleProducts = [
      {
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and superior sound quality',
        shortDescription: 'Wireless headphones with ANC',
        regularPrice: 2999,
        salePrice: 2499,
        stock: 25,
        categories: electronics ? [electronics._id] : [],
        tags: ['headphones', 'wireless', 'audio', 'bluetooth'],
        isFeatured: true,
        productType: 'simple'
      },
      {
        name: 'Professional Gaming Keyboard',
        description: 'Mechanical gaming keyboard with RGB backlighting and programmable keys',
        shortDescription: 'RGB mechanical gaming keyboard',
        regularPrice: 1899,
        stock: 40,
        categories: electronics ? [electronics._id] : [],
        tags: ['keyboard', 'gaming', 'mechanical', 'rgb'],
        isFeatured: true,
        productType: 'simple'
      },
      {
        name: 'Stainless Steel Watch',
        description: 'Elegant stainless steel wristwatch with precise quartz movement',
        shortDescription: 'Stainless steel wristwatch',
        regularPrice: 1599,
        salePrice: 1299,
        stock: 30,
        categories: electronics ? [electronics._id] : [],
        tags: ['watch', 'stainless', 'accessories', 'jewelry'],
        productType: 'simple'
      },
      {
        name: 'Fashion Handbag',
        description: 'Stylish leather handbag with multiple compartments and adjustable strap',
        shortDescription: 'Leather fashion handbag',
        regularPrice: 899,
        salePrice: 699,
        stock: 50,
        categories: clothing ? [clothing._id] : [],
        tags: ['handbag', 'fashion', 'leather', 'accessories'],
        productType: 'simple'
      },
      {
        name: 'Wireless Security Camera',
        description: 'HD wireless security camera with night vision and motion detection',
        shortDescription: 'Wireless HD security camera',
        regularPrice: 1299,
        stock: 35,
        categories: electronics ? [electronics._id] : [],
        tags: ['camera', 'security', 'wireless', 'hd'],
        isFeatured: true,
        productType: 'simple'
      }
    ];
    
    console.log('📦 Creating products with real images...');
    
    // Create products using real images
    for (let i = 0; i < Math.min(sampleProducts.length, imageFiles.length); i++) {
      const productData = sampleProducts[i];
      const imageFile = imageFiles[i];
      
      const product = new Product({
        ...productData,
        images: [`/uploads/products/${imageFile}`],
        featuredImage: `/uploads/products/${imageFile}`,
        sku: `PRD-${String(i + 1).padStart(4, '0')}`
      });
      
      await product.save();
      console.log(`✅ Created product: ${productData.name} with image: ${imageFile}`);
    }
    
    // Create additional products with remaining images
    for (let i = sampleProducts.length; i < Math.min(30, imageFiles.length); i++) {
      const imageFile = imageFiles[i];
      const randomPrice = Math.floor(Math.random() * 5000) + 500;
      const randomStock = Math.floor(Math.random() * 100) + 10;
      
      const product = new Product({
        name: `Product ${i + 1}`,
        description: `High-quality product ${i + 1} with premium features and materials`,
        shortDescription: `Premium product ${i + 1}`,
        regularPrice: randomPrice,
        salePrice: Math.floor(randomPrice * 0.8),
        stock: randomStock,
        categories: [electronics?._id || clothing?._id],
        tags: ['product', 'quality', 'premium'],
        images: [`/uploads/products/${imageFile}`],
        featuredImage: `/uploads/products/${imageFile}`,
        sku: `PRD-${String(i + 1).padStart(4, '0')}`,
        productType: 'simple',
        isFeatured: i < 10
      });
      
      await product.save();
      console.log(`✅ Created product ${i + 1} with image: ${imageFile}`);
    }
    
    console.log(`✅ Successfully created ${await Product.countDocuments()} products!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
