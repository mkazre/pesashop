const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Laybye = require('../models/Laybye');
const LaybyPlan = require('../models/LaybyPlan');
const Order = require('../models/Order');
const User = require('../models/User');
const { LAYBYE_STATUS, LAYBYE_FREQUENCY } = require('../config/constants');

const seedLaybyes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🌱 Starting laybyes seeding...');

    // Clear existing laybyes
    await Laybye.deleteMany({});
    console.log('✅ Cleared existing laybyes');

    // Get or create layby plans
    let plan1 = await LaybyPlan.findOne({ name: 'Standard 4-Payment Plan' });
    if (!plan1) {
      plan1 = await LaybyPlan.create({
        name: 'Standard 4-Payment Plan',
        description: 'Pay 20% deposit, then 4 monthly payments',
        depositPercentage: 20,
        depositAmount: 0,
        numberOfPayments: 4,
        frequency: LAYBYE_FREQUENCY.MONTHLY,
        minimumProductValue: 100,
        maximumProductValue: 0,
        expiryDays: 120,
        holdFunds: false,
        allowCancellation: true,
        keepDepositOnCancellation: false,
        cancellationFee: 0,
        cancellationFeePercentage: 0,
        allowLatePayments: true,
        latePaymentFee: 0,
        latePaymentFeePercentage: 0,
        maxMissedPayments: 3,
        emailReminders: {
          enabled: true,
          daysBefore: [7, 3, 1],
          overdueReminderInterval: 7
        },
        isActive: true,
        displayOrder: 1
      });
    }

    let plan2 = await LaybyPlan.findOne({ name: 'Premium 6-Payment Plan' });
    if (!plan2) {
      plan2 = await LaybyPlan.create({
        name: 'Premium 6-Payment Plan',
        description: 'Pay 15% deposit, then 6 monthly payments',
        depositPercentage: 15,
        depositAmount: 0,
        numberOfPayments: 6,
        frequency: LAYBYE_FREQUENCY.MONTHLY,
        minimumProductValue: 500,
        maximumProductValue: 0,
        expiryDays: 180,
        holdFunds: true,
        allowCancellation: true,
        keepDepositOnCancellation: true,
        cancellationFee: 0,
        cancellationFeePercentage: 5,
        allowLatePayments: true,
        latePaymentFee: 50,
        latePaymentFeePercentage: 0,
        maxMissedPayments: 2,
        emailReminders: {
          enabled: true,
          daysBefore: [7, 3, 1],
          overdueReminderInterval: 7
        },
        isActive: true,
        displayOrder: 2
      });
    }

    let plan3 = await LaybyPlan.findOne({ name: 'Quick 3-Payment Plan' });
    if (!plan3) {
      plan3 = await LaybyPlan.create({
        name: 'Quick 3-Payment Plan',
        description: 'Pay 30% deposit, then 3 bi-weekly payments',
        depositPercentage: 30,
        depositAmount: 0,
        numberOfPayments: 3,
        frequency: LAYBYE_FREQUENCY.BIWEEKLY,
        minimumProductValue: 50,
        maximumProductValue: 1000,
        expiryDays: 60,
        holdFunds: false,
        allowCancellation: true,
        keepDepositOnCancellation: false,
        cancellationFee: 0,
        cancellationFeePercentage: 0,
        allowLatePayments: true,
        latePaymentFee: 0,
        latePaymentFeePercentage: 0,
        maxMissedPayments: 2,
        emailReminders: {
          enabled: true,
          daysBefore: [3, 1],
          overdueReminderInterval: 7
        },
        isActive: true,
        displayOrder: 3
      });
    }

    console.log('✅ Created/verified layby plans');

    // Get customers
    const customers = await User.find({ role: 'customer' }).limit(5);
    if (customers.length === 0) {
      console.log('⚠️  No customers found. Please seed customers first.');
      await mongoose.connection.close();
      return;
    }

    // Get orders
    const orders = await Order.find().limit(10);
    if (orders.length === 0) {
      console.log('⚠️  No orders found. Please seed orders first.');
      await mongoose.connection.close();
      return;
    }

    // Create sample laybyes
    const laybyes = [];

    // Active laybye - partially paid
    const laybye1 = new Laybye({
      order: orders[0]._id,
      customer: customers[0]._id,
      laybyPlan: plan1._id,
      totalAmount: 2000,
      depositAmount: 400,
      remainingAmount: 1200,
      paidAmount: 400,
      installmentPlan: {
        frequency: LAYBYE_FREQUENCY.MONTHLY,
        numberOfPayments: 4,
        installmentAmount: 400
      },
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: LAYBYE_STATUS.ACTIVE,
      payments: [{
        amount: 400,
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Bank Transfer',
        status: 'completed',
        note: 'Initial deposit'
      }],
      notes: 'Customer is making good progress',
      holdFunds: false
    });
    laybyes.push(laybye1);

    // Active laybye - overdue
    const laybye2 = new Laybye({
      order: orders[1]?._id || orders[0]._id,
      customer: customers[1]?._id || customers[0]._id,
      laybyPlan: plan2._id,
      totalAmount: 5000,
      depositAmount: 750,
      remainingAmount: 3500,
      paidAmount: 750,
      installmentPlan: {
        frequency: LAYBYE_FREQUENCY.MONTHLY,
        numberOfPayments: 6,
        installmentAmount: 708.33
      },
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      nextPaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (overdue)
      expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      status: LAYBYE_STATUS.ACTIVE,
      missedPayments: 1,
      payments: [{
        amount: 750,
        paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Credit Card',
        status: 'completed',
        note: 'Initial deposit'
      }],
      notes: 'Customer needs reminder',
      holdFunds: true
    });
    laybyes.push(laybye2);

    // Completed laybye
    const laybye3 = new Laybye({
      order: orders[2]?._id || orders[0]._id,
      customer: customers[2]?._id || customers[0]._id,
      laybyPlan: plan3._id,
      totalAmount: 1500,
      depositAmount: 450,
      remainingAmount: 0,
      paidAmount: 1500,
      installmentPlan: {
        frequency: LAYBYE_FREQUENCY.BIWEEKLY,
        numberOfPayments: 3,
        installmentAmount: 350
      },
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: LAYBYE_STATUS.COMPLETED,
      payments: [
        {
          amount: 450,
          paymentDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          paymentMethod: 'Cash',
          status: 'completed',
          note: 'Initial deposit'
        },
        {
          amount: 350,
          paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          paymentMethod: 'Bank Transfer',
          status: 'completed'
        },
        {
          amount: 350,
          paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'Bank Transfer',
          status: 'completed'
        },
        {
          amount: 350,
          paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          paymentMethod: 'Bank Transfer',
          status: 'completed',
          note: 'Final payment'
        }
      ],
      notes: 'Successfully completed',
      holdFunds: false
    });
    laybyes.push(laybye3);

    // Cancelled laybye
    const laybye4 = new Laybye({
      order: orders[3]?._id || orders[0]._id,
      customer: customers[3]?._id || customers[0]._id,
      laybyPlan: plan1._id,
      totalAmount: 3000,
      depositAmount: 600,
      remainingAmount: 2400,
      paidAmount: 600,
      installmentPlan: {
        frequency: LAYBYE_FREQUENCY.MONTHLY,
        numberOfPayments: 4,
        installmentAmount: 600
      },
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      cancelledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: LAYBYE_STATUS.CANCELLED,
      cancellationReason: 'Customer requested cancellation',
      keepDeposit: false,
      refundAmount: 600,
      refundProcessed: true,
      refundProcessedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      payments: [{
        amount: 600,
        paymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Credit Card',
        status: 'completed',
        note: 'Initial deposit - refunded'
      }],
      notes: 'Cancelled by customer request',
      holdFunds: false
    });
    laybyes.push(laybye4);

    // Active laybye - just started
    const laybye5 = new Laybye({
      order: orders[4]?._id || orders[0]._id,
      customer: customers[4]?._id || customers[0]._id,
      laybyPlan: plan3._id,
      totalAmount: 800,
      depositAmount: 240,
      remainingAmount: 560,
      paidAmount: 240,
      installmentPlan: {
        frequency: LAYBYE_FREQUENCY.BIWEEKLY,
        numberOfPayments: 3,
        installmentAmount: 186.67
      },
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      nextPaymentDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      expiryDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000),
      status: LAYBYE_STATUS.ACTIVE,
      payments: [{
        amount: 240,
        paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Cash',
        status: 'completed',
        note: 'Initial deposit'
      }],
      notes: 'New laybye',
      holdFunds: false
    });
    laybyes.push(laybye5);

    // Save all laybyes
    await Laybye.insertMany(laybyes);
    console.log(`✅ Created ${laybyes.length} laybyes`);

    // Update orders to link laybyes
    for (let i = 0; i < Math.min(laybyes.length, orders.length); i++) {
      await Order.findByIdAndUpdate(orders[i]._id, {
        isLaybye: true,
        laybye: laybyes[i]._id,
        paymentMethod: 'layby',
        paymentMethodTitle: 'Layby',
        paymentStatus: laybyes[i].status === LAYBYE_STATUS.COMPLETED ? 'completed' : 'pending'
      });
    }

    console.log('✅ Updated orders with laybye references');

    console.log('\n📊 Laybyes Summary:');
    console.log(`  - Total laybyes: ${laybyes.length}`);
    console.log(`  - Active: ${laybyes.filter(l => l.status === LAYBYE_STATUS.ACTIVE).length}`);
    console.log(`  - Completed: ${laybyes.filter(l => l.status === LAYBYE_STATUS.COMPLETED).length}`);
    console.log(`  - Cancelled: ${laybyes.filter(l => l.status === LAYBYE_STATUS.CANCELLED).length}`);
    console.log(`  - Overdue: ${laybyes.filter(l => l.status === LAYBYE_STATUS.ACTIVE && l.nextPaymentDate < new Date()).length}`);

    await mongoose.connection.close();
    console.log('\n✅ Laybyes seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding laybyes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
if (require.main === module) {
  seedLaybyes();
}

module.exports = seedLaybyes;
