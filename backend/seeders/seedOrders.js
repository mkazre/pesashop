require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

const seedOrders = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing orders...');
    await Order.deleteMany({});

    // Get existing users and products
    const customers = await User.find({ role: 'customer' }).limit(5);
    const products = await Product.find().limit(10);

    if (customers.length === 0) {
      console.log('⚠️  No customers found. Creating test customer...');
      const testCustomer = await User.create({
        email: 'customer@example.com',
        password: 'Customer123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      });
      customers.push(testCustomer);
    }

    if (products.length === 0) {
      console.log('⚠️  No products found. Please seed products first.');
      process.exit(1);
    }

    console.log('📦 Creating orders...');

    const ordersData = [
      {
        customer: customers[0]._id,
        items: [
          {
            product: products[0]._id,
            name: products[0].name,
            sku: products[0].sku,
            quantity: 2,
            price: products[0].regularPrice,
            salePrice: products[0].salePrice,
            total: (products[0].salePrice || products[0].regularPrice) * 2
          },
          {
            product: products[1]?._id || products[0]._id,
            name: products[1]?.name || products[0].name,
            sku: products[1]?.sku || products[0].sku,
            quantity: 1,
            price: products[1]?.regularPrice || products[0].regularPrice,
            total: products[1]?.regularPrice || products[0].regularPrice
          }
        ],
        subtotal: 0, // Will be calculated
        tax: 0,
        taxRate: 15,
        shipping: 50,
        shippingMethod: 'Standard Shipping',
        discount: 0,
        total: 0, // Will be calculated
        currency: 'ZAR',
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        paymentMethod: 'credit_card',
        paymentMethodTitle: 'Credit Card',
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        status: ORDER_STATUS.COMPLETED,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            note: 'Order placed',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.PROCESSING,
            note: 'Payment received',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.COMPLETED,
            note: 'Order completed',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ],
        shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trackingNumber: 'TRACK123456',
        trackingUrl: 'https://tracking.example.com/TRACK123456',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[0]._id,
        items: [
          {
            product: products[2]?._id || products[0]._id,
            name: products[2]?.name || products[0].name,
            sku: products[2]?.sku || products[0].sku,
            quantity: 1,
            price: products[2]?.regularPrice || products[0].regularPrice,
            total: products[2]?.regularPrice || products[0].regularPrice
          }
        ],
        subtotal: 0,
        tax: 0,
        taxRate: 15,
        shipping: 30,
        shippingMethod: 'Express Shipping',
        discount: 0,
        total: 0,
        currency: 'ZAR',
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        paymentMethod: 'bank_transfer',
        paymentMethodTitle: 'Bank Transfer',
        paymentStatus: PAYMENT_STATUS.PENDING,
        status: ORDER_STATUS.PROCESSING,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            note: 'Order placed, awaiting payment',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.PROCESSING,
            note: 'Payment processing',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[0]._id,
        items: [
          {
            product: products[3]?._id || products[0]._id,
            name: products[3]?.name || products[0].name,
            sku: products[3]?.sku || products[0].sku,
            quantity: 3,
            price: products[3]?.regularPrice || products[0].regularPrice,
            total: (products[3]?.regularPrice || products[0].regularPrice) * 3
          }
        ],
        subtotal: 0,
        tax: 0,
        taxRate: 15,
        shipping: 0,
        shippingMethod: 'Free Shipping',
        discount: 50,
        total: 0,
        currency: 'ZAR',
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        paymentMethod: 'paypal',
        paymentMethodTitle: 'PayPal',
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        status: ORDER_STATUS.ON_HOLD,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            note: 'Order placed',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.ON_HOLD,
            note: 'Order on hold - awaiting stock',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
          }
        ],
        adminNote: 'Waiting for stock replenishment',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[0]._id,
        items: [
          {
            product: products[4]?._id || products[0]._id,
            name: products[4]?.name || products[0].name,
            sku: products[4]?.sku || products[0].sku,
            quantity: 1,
            price: products[4]?.regularPrice || products[0].regularPrice,
            total: products[4]?.regularPrice || products[0].regularPrice
          }
        ],
        subtotal: 0,
        tax: 0,
        taxRate: 15,
        shipping: 25,
        shippingMethod: 'Standard Shipping',
        discount: 0,
        total: 0,
        currency: 'ZAR',
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        paymentMethod: 'credit_card',
        paymentMethodTitle: 'Credit Card',
        paymentStatus: PAYMENT_STATUS.FAILED,
        status: ORDER_STATUS.FAILED,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            note: 'Order placed',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.FAILED,
            note: 'Payment failed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ],
        adminNote: 'Payment declined by bank',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        customer: customers[0]._id,
        items: [
          {
            product: products[5]?._id || products[0]._id,
            name: products[5]?.name || products[0].name,
            sku: products[5]?.sku || products[0].sku,
            quantity: 2,
            price: products[5]?.regularPrice || products[0].regularPrice,
            total: (products[5]?.regularPrice || products[0].regularPrice) * 2
          },
          {
            product: products[6]?._id || products[0]._id,
            name: products[6]?.name || products[0].name,
            sku: products[6]?.sku || products[0].sku,
            quantity: 1,
            price: products[6]?.regularPrice || products[0].regularPrice,
            total: products[6]?.regularPrice || products[0].regularPrice
          }
        ],
        subtotal: 0,
        tax: 0,
        taxRate: 15,
        shipping: 75,
        shippingMethod: 'Express Shipping',
        discount: 100,
        total: 0,
        currency: 'ZAR',
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Johannesburg',
          state: 'Gauteng',
          country: 'South Africa',
          postalCode: '2000',
          phone: '+27123456789',
          email: customers[0].email
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '456 Oak Avenue',
          city: 'Cape Town',
          state: 'Western Cape',
          country: 'South Africa',
          postalCode: '8001',
          phone: '+27123456789',
          email: customers[0].email
        },
        paymentMethod: 'credit_card',
        paymentMethodTitle: 'Credit Card',
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        status: ORDER_STATUS.CANCELLED,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            note: 'Order placed',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.PROCESSING,
            note: 'Payment received',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          },
          {
            status: ORDER_STATUS.CANCELLED,
            note: 'Order cancelled by customer',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ],
        adminNote: 'Customer requested cancellation',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];

    // Calculate totals and create orders
    let orderCounter = 1;
    for (const orderData of ordersData) {
      orderData.subtotal = orderData.items.reduce((sum, item) => sum + item.total, 0);
      orderData.tax = orderData.subtotal * (orderData.taxRate / 100);
      orderData.total = orderData.subtotal + orderData.tax + orderData.shipping - orderData.discount;
      
      // Generate order number manually
      const timestamp = Date.now();
      orderData.orderNumber = `ORD-${timestamp}-${String(orderCounter).padStart(5, '0')}`;
      orderCounter++;
      
      const order = await Order.create(orderData);
      console.log(`✅ Created order ${order.orderNumber} - Status: ${order.status}, Payment: ${order.paymentStatus}`);
    }

    console.log(`\n✅ Successfully created ${ordersData.length} orders!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    process.exit(1);
  }
};

seedOrders();
