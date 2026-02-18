require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

const reassignOrders = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Reassigning orders to customers based on their totalSpent and orderCount...');
    
    // Get all customers with orders/spending
    const customers = await User.find({ 
      role: 'customer',
      $or: [
        { totalSpent: { $gt: 0 } },
        { orderCount: { $gt: 0 } }
      ]
    }).sort({ totalSpent: -1 });
    
    console.log(`Found ${customers.length} customers with orders/spending`);
    
    // Get all existing orders
    const allOrders = await Order.find().sort({ createdAt: -1 });
    console.log(`Found ${allOrders.length} existing orders`);
    
    // Delete all existing orders
    await Order.deleteMany({});
    console.log('🗑️  Cleared all existing orders');
    
    // Get products for order items
    const products = await Product.find().limit(10);
    if (products.length === 0) {
      console.log('⚠️  No products found. Please seed products first.');
      process.exit(1);
    }
    
    // Create orders for each customer based on their orderCount and totalSpent
    let orderIndex = 1;
    
    for (const customer of customers) {
      const orderCount = customer.orderCount || 0;
      const totalSpent = customer.totalSpent || 0;
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      
      if (orderCount === 0 || totalSpent === 0) continue;
      
      console.log(`\n📦 Creating ${orderCount} orders for ${customer.firstName} ${customer.lastName} (Total: R ${totalSpent.toFixed(2)})`);
      
      for (let i = 0; i < orderCount; i++) {
        // Calculate order value (distribute totalSpent across orders)
        const orderValue = i === orderCount - 1 
          ? totalSpent - (avgOrderValue * (orderCount - 1)) // Last order gets remainder
          : avgOrderValue;
        
        // Create order items
        const items = [];
        let itemsTotal = 0;
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
        
        for (let j = 0; j < numItems && itemsTotal < orderValue; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = product.salePrice || product.regularPrice;
          const itemTotal = Math.min(price * quantity, orderValue - itemsTotal);
          
          items.push({
            product: product._id,
            name: product.name,
            sku: product.sku,
            quantity: quantity,
            price: price,
            salePrice: product.salePrice,
            total: itemTotal
          });
          
          itemsTotal += itemTotal;
        }
        
        // Adjust last item to match order value exactly
        if (items.length > 0 && itemsTotal !== orderValue) {
          const diff = orderValue - itemsTotal;
          items[items.length - 1].total += diff;
        }
        
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15; // 15% tax
        const shipping = 50;
        const total = subtotal + tax + shipping;
        
        // Generate order number
        const timestamp = Date.now();
        const count = orderIndex;
        const orderNumber = `ORD-${timestamp}-${count.toString().padStart(5, '0')}`;
        
        // Create order
        const order = new Order({
          orderNumber: orderNumber,
          customer: customer._id,
          items: items,
          subtotal: subtotal,
          tax: tax,
          taxRate: 15,
          shipping: shipping,
          shippingMethod: 'Standard Shipping',
          discount: 0,
          total: total,
          currency: 'ZAR',
          billingAddress: customer.addresses?.find(a => a.type === 'billing') || {
            firstName: customer.firstName,
            lastName: customer.lastName,
            street: '123 Main Street',
            city: 'Johannesburg',
            state: 'Gauteng',
            country: 'South Africa',
            postalCode: '2000',
            phone: customer.phone,
            email: customer.email
          },
          shippingAddress: customer.addresses?.find(a => a.type === 'shipping') || {
            firstName: customer.firstName,
            lastName: customer.lastName,
            street: '123 Main Street',
            city: 'Johannesburg',
            state: 'Gauteng',
            country: 'South Africa',
            postalCode: '2000',
            phone: customer.phone,
            email: customer.email
          },
          paymentMethod: 'credit_card',
          paymentMethodTitle: 'Credit Card',
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          status: i === 0 ? ORDER_STATUS.COMPLETED : ORDER_STATUS.PROCESSING,
          statusHistory: [
            {
              status: ORDER_STATUS.PENDING,
              note: 'Order placed',
              timestamp: new Date(Date.now() - (orderCount - i) * 24 * 60 * 60 * 1000)
            }
          ],
          loyaltyPointsEarned: Math.floor(total * 0.01), // 1 point per R1
          createdAt: new Date(Date.now() - (orderCount - i) * 24 * 60 * 60 * 1000)
        });
        
        await order.save();
        orderIndex++;
      }
    }
    
    console.log(`\n✅ Successfully created orders for ${customers.length} customers!`);
    console.log(`📊 Total orders created: ${orderIndex - 1}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reassigning orders:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  reassignOrders();
}

module.exports = reassignOrders;
