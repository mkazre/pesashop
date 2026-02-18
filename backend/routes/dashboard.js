const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Laybye = require('../models/Laybye');
const LaybyPlan = require('../models/LaybyPlan');
const { USER_ROLES } = require('../config/constants');
const { LAYBYE_STATUS } = require('../config/constants');

// GET dashboard statistics
router.get('/stats', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Orders statistics
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      yearOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfYear } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'cancelled' })
    ]);

    // Products statistics
    // Count all non-trash products (including those without status field)
    const nonTrashQuery = {
      $or: [
        { status: { $exists: false } },
        { status: { $ne: 'trash' } },
        { status: null }
      ]
    };
    
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts
    ] = await Promise.all([
      Product.countDocuments(nonTrashQuery),
      Product.countDocuments({
        $or: [
          { status: 'active' },
          { status: { $exists: false } },
          { status: null }
        ]
      }),
      Product.countDocuments({ ...nonTrashQuery, stock: 0 }),
      Product.countDocuments({ ...nonTrashQuery, stock: { $gt: 0, $lte: 10 } })
    ]);

    // Customers statistics
    const [
      totalCustomers,
      activeCustomers,
      newCustomersToday,
      newCustomersWeek,
      newCustomersMonth
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.CUSTOMER }),
      User.countDocuments({ role: USER_ROLES.CUSTOMER, isActive: true }),
      User.countDocuments({ 
        role: USER_ROLES.CUSTOMER, 
        createdAt: { $gte: startOfToday } 
      }),
      User.countDocuments({ 
        role: USER_ROLES.CUSTOMER, 
        createdAt: { $gte: startOfWeek } 
      }),
      User.countDocuments({ 
        role: USER_ROLES.CUSTOMER, 
        createdAt: { $gte: startOfMonth } 
      })
    ]);

    // Categories statistics
    const totalCategories = await Category.countDocuments();

    // Laybyes statistics
    const [
      totalLaybyes,
      activeLaybyes,
      completedLaybyes,
      cancelledLaybyes,
      overdueLaybyes,
      totalLaybyPlans
    ] = await Promise.all([
      Laybye.countDocuments(),
      Laybye.countDocuments({ status: LAYBYE_STATUS.ACTIVE }),
      Laybye.countDocuments({ status: LAYBYE_STATUS.COMPLETED }),
      Laybye.countDocuments({ status: LAYBYE_STATUS.CANCELLED }),
      Laybye.countDocuments({
        status: LAYBYE_STATUS.ACTIVE,
        nextPaymentDate: { $lt: new Date() }
      }),
      LaybyPlan.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
          year: yearOrders,
          byStatus: {
            pending: pendingOrders,
            processing: processingOrders,
            completed: completedOrders,
            cancelled: cancelledOrders
          }
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
          week: weekRevenue[0]?.total || 0,
          month: monthRevenue[0]?.total || 0,
          year: yearRevenue[0]?.total || 0
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          newToday: newCustomersToday,
          newWeek: newCustomersWeek,
          newMonth: newCustomersMonth
        },
        categories: {
          total: totalCategories
        },
        laybyes: {
          total: totalLaybyes,
          active: activeLaybyes,
          completed: completedLaybyes,
          cancelled: cancelledLaybyes,
          overdue: overdueLaybyes,
          plans: totalLaybyPlans
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
