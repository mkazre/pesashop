const { LoyaltyPoint, LoyaltySetting } = require('../models/LoyaltyPoint');
const LoyaltyRule = require('../models/LoyaltyRule');
const LoyaltyLevel = require('../models/LoyaltyLevel');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { LOYALTY_TYPES } = require('../config/constants');

class LoyaltyService {
  /**
   * Calculate points earned for an order
   */
  async calculateOrderPoints(order, user) {
    try {
      const settings = await LoyaltySetting.findOne();
      if (!settings || !settings.enabled) return 0;
      
      // Check if user is banned
      if (user.loyaltyPointsBanned) return 0;
      
      // Check if points should not be assigned (redemption order)
      if (settings.noPointsOnRedemption && order.loyaltyPointsUsed > 0) return 0;
      
      // Get user's current level
      const userLevel = user.currentLoyaltyLevel 
        ? await LoyaltyLevel.findById(user.currentLoyaltyLevel)
        : await LoyaltyLevel.getLevelByPoints(user.loyaltyPoints || 0);
      
      let totalPoints = 0;
      
      // Process each order item
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        
        // Check global exclusions
        if (settings.excludeProducts.some(id => id.toString() === product._id.toString())) continue;
        if (product.categories && settings.excludeCategories.some(catId => 
          product.categories.some(c => (c._id ? c._id.toString() : c.toString()) === catId.toString())
        )) continue;
        if (settings.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) continue;
        
        // Get price based on priceBase setting
        const priceBase = settings.priceBase || 'regular';
        let itemPrice = product.regularPrice;
        if (priceBase === 'backend') {
          itemPrice = product.backendPrice || product.regularPrice;
        } else if (priceBase === 'sale') {
          itemPrice = product.salePrice || product.regularPrice;
        }
        
        const itemTotal = itemPrice * item.quantity;
        
        // Check for matching rules
        const rules = await LoyaltyRule.find({
          ruleType: 'earning',
          isActive: true
        })
        .populate('applyToProducts')
        .populate('excludeProducts')
        .populate('applyToCategories')
        .populate('excludeCategories')
        .populate('applyToLevels')
        .populate('excludeLevels')
        .sort({ priority: -1 });
        
        let ruleApplied = false;
        for (const rule of rules) {
          // Convert rule to plain object to use the method
          const ruleDoc = rule.toObject ? rule : rule;
          // Check if rule applies using the model method
          try {
            // For redemption rules, check user/level conditions
            if (rule.ruleType === 'redemption') {
              let applies = true;
              
              if (user) {
                if (rule.excludeRoles && rule.excludeRoles.length > 0 && rule.excludeRoles.includes(user.role)) {
                  applies = false;
                }
                if (rule.applyToRoles && rule.applyToRoles.length > 0 && !rule.applyToRoles.includes(user.role)) {
                  applies = false;
                }
                if (rule.excludeGroups && rule.excludeGroups.length > 0 && rule.excludeGroups.includes(user.customerGroup)) {
                  applies = false;
                }
                if (rule.applyToGroups && rule.applyToGroups.length > 0 && !rule.applyToGroups.includes(user.customerGroup)) {
                  applies = false;
                }
              }
              
              if (userLevel) {
                const levelIds = rule.excludeLevels?.map(l => l._id ? l._id.toString() : l.toString()) || [];
                if (levelIds.length > 0 && levelIds.includes(userLevel._id.toString())) {
                  applies = false;
                }
                const applyLevelIds = rule.applyToLevels?.map(l => l._id ? l._id.toString() : l.toString()) || [];
                if (applyLevelIds.length > 0 && !applyLevelIds.includes(userLevel._id.toString())) {
                  applies = false;
                }
              }
              
              if (!applies) continue;
            } else {
              // For earning rules, use the appliesToProduct method
              if (typeof rule.appliesToProduct === 'function') {
                if (!rule.appliesToProduct(product, user, userLevel)) {
                  continue;
                }
              } else {
                // Fallback manual check
                const productId = product._id.toString();
                const productCategoryIds = (product.categories || []).map(c => (c._id ? c._id.toString() : c.toString()));
                
                // Check product exclusions
                if (rule.excludeProducts && rule.excludeProducts.length > 0) {
                  const excludeIds = rule.excludeProducts.map(p => (p._id ? p._id.toString() : p.toString()));
                  if (excludeIds.includes(productId)) continue;
                }
                
                // Check product inclusions
                if (rule.applyToProducts && rule.applyToProducts.length > 0) {
                  const applyIds = rule.applyToProducts.map(p => (p._id ? p._id.toString() : p.toString()));
                  if (!applyIds.includes(productId)) continue;
                }
                
                // Check category exclusions
                if (rule.excludeCategories && rule.excludeCategories.length > 0) {
                  const excludeCatIds = rule.excludeCategories.map(c => (c._id ? c._id.toString() : c.toString()));
                  if (productCategoryIds.some(cid => excludeCatIds.includes(cid))) continue;
                }
                
                // Check category inclusions
                if (rule.applyToCategories && rule.applyToCategories.length > 0) {
                  const applyCatIds = rule.applyToCategories.map(c => (c._id ? c._id.toString() : c.toString()));
                  if (productCategoryIds.length === 0 || !productCategoryIds.some(cid => applyCatIds.includes(cid))) continue;
                }
                
                // Check on-sale exclusion
                if (rule.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) {
                  continue;
                }
                
                // Check price range
                const productPrice = rule.priceBase === 'backend' ? (product.backendPrice || product.regularPrice) :
                  rule.priceBase === 'sale' ? (product.salePrice || product.regularPrice) :
                  product.regularPrice;
                
                if (rule.minPrice && productPrice < rule.minPrice) continue;
                if (rule.maxPrice && productPrice > rule.maxPrice) continue;
                
                // Check user role
                if (user) {
                  if (rule.excludeRoles && rule.excludeRoles.length > 0 && rule.excludeRoles.includes(user.role)) {
                    continue;
                  }
                  if (rule.applyToRoles && rule.applyToRoles.length > 0 && !rule.applyToRoles.includes(user.role)) {
                    continue;
                  }
                  if (rule.excludeGroups && rule.excludeGroups.length > 0 && rule.excludeGroups.includes(user.customerGroup)) {
                    continue;
                  }
                  if (rule.applyToGroups && rule.applyToGroups.length > 0 && !rule.applyToGroups.includes(user.customerGroup)) {
                    continue;
                  }
                }
                
                // Check loyalty level
                if (userLevel) {
                  const levelIds = rule.excludeLevels?.map(l => (l._id ? l._id.toString() : l.toString())) || [];
                  if (levelIds.length > 0 && levelIds.includes(userLevel._id.toString())) {
                    continue;
                  }
                  const applyLevelIds = rule.applyToLevels?.map(l => (l._id ? l._id.toString() : l.toString())) || [];
                  if (applyLevelIds.length > 0 && !applyLevelIds.includes(userLevel._id.toString())) {
                    continue;
                  }
                }
              }
            }
            
            // Rule applies - calculate points
            // Calculate points based on rule
            let points = 0;
            if (rule.fixedPoints) {
              points = rule.fixedPoints * item.quantity;
            } else if (rule.pointsPerCurrency) {
              points = itemTotal * rule.pointsPerCurrency;
            } else if (rule.pointsPerCurrencyPercentage) {
              points = (itemTotal * rule.pointsPerCurrencyPercentage) / 100;
            }
            
            // Apply level multiplier if applicable
            if (userLevel && userLevel.pointsEarningMultiplier) {
              points *= userLevel.pointsEarningMultiplier;
            }
            
            totalPoints += Math.floor(points);
            ruleApplied = true;
            rule.usageCount += 1;
            await rule.save();
            break; // Use first matching rule
          } catch (outerError) {
            console.error('Error checking rule applicability:', outerError);
            continue; // Skip this rule and try next one
          }
        }
        
        // If no rule matched, use global rate
        if (!ruleApplied) {
          let points = itemTotal * settings.pointsPerCurrency;
          
          // Apply group multiplier
          if (user.customerGroup && settings.groupMultipliers.length > 0) {
            const groupMultiplier = settings.groupMultipliers.find(gm => gm.group === user.customerGroup);
            if (groupMultiplier) {
              points *= groupMultiplier.multiplier;
            }
          }
          
          // Apply level multiplier
          if (userLevel && userLevel.pointsEarningMultiplier) {
            points *= userLevel.pointsEarningMultiplier;
          }
          
          totalPoints += Math.floor(points);
        }
      }
      
      // Apply minimum order amount check
      if (order.total < settings.minimumOrderAmount) {
        return 0;
      }
      
      return Math.floor(totalPoints);
    } catch (error) {
      console.error('Error calculating order points:', error);
      return 0;
    }
  }
  
  /**
   * Assign points for an order
   */
  async assignOrderPoints(orderId) {
    try {
      const order = await Order.findById(orderId).populate('customer');
      if (!order || !order.customer) return;
      
      const settings = await LoyaltySetting.findOne();
      if (!settings || !settings.enabled) return;
      
      // Check assignment mode
      if (settings.assignmentMode === 'manual') return;
      
      // Check order status
      const assignStatus = settings.assignOnOrderStatus.length > 0 
        ? settings.assignOnOrderStatus 
        : [settings.defaultAssignStatus || 'completed'];
      
      if (!assignStatus.includes(order.status)) return;
      
      // Check if points already assigned
      const existingPoints = await LoyaltyPoint.findOne({
        order: orderId,
        type: LOYALTY_TYPES.EARNED
      });
      if (existingPoints) return;
      
      const points = await this.calculateOrderPoints(order, order.customer);
      if (points > 0) {
        await LoyaltyPoint.addPoints(
          order.customer._id,
          points,
          LOYALTY_TYPES.EARNED,
          `Points earned from order #${order.orderNumber}`,
          orderId
        );
        
        // Update order
        await Order.findByIdAndUpdate(orderId, {
          loyaltyPointsEarned: points
        });
        
        // Check for level up
        await this.checkLevelUp(order.customer._id);
      }
    } catch (error) {
      console.error('Error assigning order points:', error);
    }
  }
  
  /**
   * Remove points for canceled/refunded order
   */
  async removeOrderPoints(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order || !order.loyaltyPointsEarned) return;
      
      const settings = await LoyaltySetting.findOne();
      if (!settings) return;
      
      if ((order.status === 'cancelled' && settings.removeOnCancel) ||
          (order.status === 'refunded' && settings.removeOnRefund)) {
        
        const points = await LoyaltyPoint.findOne({
          order: orderId,
          type: LOYALTY_TYPES.EARNED
        });
        
        if (points) {
          // Remove the points
          await LoyaltyPoint.addPoints(
            order.customer,
            -points.points,
            LOYALTY_TYPES.ADJUSTED,
            `Points removed for ${order.status} order #${order.orderNumber}`,
            orderId
          );
        }
      }
    } catch (error) {
      console.error('Error removing order points:', error);
    }
  }
  
  /**
   * Check and update user's loyalty level
   */
  async checkLevelUp(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      const currentPoints = user.loyaltyPoints || 0;
      const newLevel = await LoyaltyLevel.getLevelByPoints(currentPoints);
      
      if (newLevel && (!user.currentLoyaltyLevel || user.currentLoyaltyLevel.toString() !== newLevel._id.toString())) {
        const oldLevel = user.currentLoyaltyLevel 
          ? await LoyaltyLevel.findById(user.currentLoyaltyLevel)
          : null;
        
        // Update user level
        user.currentLoyaltyLevel = newLevel._id;
        await user.save();
        
        // Award bonus points if configured
        const settings = await LoyaltySetting.findOne();
        if (settings && settings.levelAchievementBonus && newLevel.extraPointsOnAchievement > 0) {
          await LoyaltyPoint.addPoints(
            userId,
            newLevel.extraPointsOnAchievement,
            LOYALTY_TYPES.LEVEL_ACHIEVEMENT,
            `Level up bonus: ${newLevel.name}`
          );
        }
        
        // Update level user count
        if (oldLevel) {
          oldLevel.usersCount = Math.max(0, oldLevel.usersCount - 1);
          await oldLevel.save();
        }
        newLevel.usersCount += 1;
        await newLevel.save();
        
        // Send email notification if enabled
        if (settings && settings.emailNotifications && settings.emailNotifications.onLevelUp) {
          // TODO: Send level up email
        }
      }
    } catch (error) {
      console.error('Error checking level up:', error);
    }
  }
  
  /**
   * Award extra points for various events
   */
  async awardExtraPoints(userId, eventType, data = {}) {
    try {
      const settings = await LoyaltySetting.findOne();
      if (!settings || !settings.enabled) return;
      
      const user = await User.findById(userId);
      if (!user || user.loyaltyPointsBanned) return;
      
      let points = 0;
      let reason = '';
      
      switch (eventType) {
        case 'signup':
          points = settings.signupBonus || 0;
          reason = 'Welcome bonus for registration';
          break;
        case 'daily_login':
          points = settings.dailyLoginBonus || 0;
          reason = 'Daily login bonus';
          break;
        case 'profile_complete':
          points = settings.profileCompleteBonus || 0;
          reason = 'Profile completion bonus';
          break;
        case 'referral_registration':
          points = settings.referralRegistrationBonus || 0;
          reason = `Referral registration: ${data.referredUserEmail || 'new user'}`;
          break;
        case 'referral_purchase':
          points = settings.referralPurchaseBonus || 0;
          reason = `Referral purchase: Order #${data.orderNumber || 'N/A'}`;
          break;
        case 'birthday':
          points = settings.birthdayBonus || 0;
          reason = 'Birthday bonus';
          break;
        case 'review':
          points = settings.reviewBonus || 0;
          reason = `Review bonus for product: ${data.productName || 'N/A'}`;
          break;
        case 'order_count':
          if (settings.orderCountBonuses && settings.orderCountBonuses.length > 0) {
            const bonus = settings.orderCountBonuses
              .sort((a, b) => b.orderCount - a.orderCount)
              .find(b => user.orderCount >= b.orderCount);
            if (bonus) {
              points = bonus.bonusPoints;
              reason = `Order count milestone: ${bonus.orderCount} orders`;
            }
          }
          break;
        case 'cart_total':
          if (settings.cartTotalBonuses && settings.cartTotalBonuses.length > 0 && data.cartTotal) {
            const bonus = settings.cartTotalBonuses
              .sort((a, b) => b.cartTotal - a.cartTotal)
              .find(b => data.cartTotal >= b.cartTotal);
            if (bonus) {
              points = bonus.bonusPoints;
              reason = `Cart total milestone: R ${bonus.cartTotal}`;
            }
          }
          break;
        case 'total_spent':
          if (settings.totalSpentBonuses && settings.totalSpentBonuses.length > 0) {
            const bonus = settings.totalSpentBonuses
              .sort((a, b) => b.totalSpent - a.totalSpent)
              .find(b => user.totalSpent >= b.totalSpent);
            if (bonus) {
              points = bonus.bonusPoints;
              reason = `Total spent milestone: R ${bonus.totalSpent}`;
            }
          }
          break;
      }
      
      if (points > 0) {
        const typeMap = {
          'signup': LOYALTY_TYPES.SIGNUP_BONUS,
          'daily_login': LOYALTY_TYPES.DAILY_LOGIN,
          'profile_complete': LOYALTY_TYPES.PROFILE_COMPLETE,
          'referral_registration': LOYALTY_TYPES.REFERRAL_REGISTRATION,
          'referral_purchase': LOYALTY_TYPES.REFERRAL_PURCHASE,
          'birthday': LOYALTY_TYPES.BIRTHDAY_BONUS,
          'review': LOYALTY_TYPES.REVIEW_BONUS,
          'order_count': LOYALTY_TYPES.ORDER_COUNT_BONUS,
          'cart_total': LOYALTY_TYPES.CART_TOTAL_BONUS,
          'total_spent': LOYALTY_TYPES.TOTAL_SPENT_BONUS
        };
        
        await LoyaltyPoint.addPoints(
          userId,
          points,
          typeMap[eventType] || LOYALTY_TYPES.EARNED,
          reason
        );
        
        await this.checkLevelUp(userId);
      }
    } catch (error) {
      console.error('Error awarding extra points:', error);
    }
  }
  
  /**
   * Calculate redemption value
   */
  async calculateRedemptionValue(points, user, orderTotal = 0) {
    try {
      const settings = await LoyaltySetting.findOne();
      if (!settings || !settings.enabled) return { value: 0, points: 0 };
      
      // Check minimum points
      if (points < settings.minRedemptionPoints) {
        return { value: 0, points: 0, error: `Minimum ${settings.minRedemptionPoints} points required` };
      }
      
      // Get user's current level
      const userLevel = user.currentLoyaltyLevel 
        ? await LoyaltyLevel.findById(user.currentLoyaltyLevel)
        : await LoyaltyLevel.getLevelByPoints(user.loyaltyPoints || 0);
      
      // Check for matching redemption rules
      const rules = await LoyaltyRule.find({
        ruleType: 'redemption',
        isActive: true
      }).sort({ priority: -1 });
      
      let redemptionRate = settings.redemptionRate || 0.1;
      let maxPoints = settings.maxRedemptionPoints;
      let maxPercentage = settings.maxRedemptionPercentage;
      
      for (const rule of rules) {
        // For redemption rules, we check user/level conditions, not product
        let applies = true;
        
        // Check user role
        if (user) {
          if (rule.excludeRoles && rule.excludeRoles.length > 0 && rule.excludeRoles.includes(user.role)) {
            applies = false;
          }
          if (rule.applyToRoles && rule.applyToRoles.length > 0 && !rule.applyToRoles.includes(user.role)) {
            applies = false;
          }
          
          // Check customer group
          if (rule.excludeGroups && rule.excludeGroups.length > 0 && rule.excludeGroups.includes(user.customerGroup)) {
            applies = false;
          }
          if (rule.applyToGroups && rule.applyToGroups.length > 0 && !rule.applyToGroups.includes(user.customerGroup)) {
            applies = false;
          }
        }
        
        // Check loyalty level
        if (userLevel) {
          if (rule.excludeLevels && rule.excludeLevels.length > 0 && rule.excludeLevels.some(id => id.toString() === userLevel._id.toString())) {
            applies = false;
          }
          if (rule.applyToLevels && rule.applyToLevels.length > 0 && !rule.applyToLevels.some(id => id.toString() === userLevel._id.toString())) {
            applies = false;
          }
        }
        
        if (applies) {
          if (rule.redemptionRate) redemptionRate = rule.redemptionRate;
          if (rule.maxRedemptionPoints) maxPoints = rule.maxRedemptionPoints;
          if (rule.maxRedemptionPercentage) maxPercentage = rule.maxRedemptionPercentage;
          break;
        }
      }
      
      // Apply level multiplier
      if (userLevel && userLevel.redemptionMultiplier) {
        redemptionRate *= userLevel.redemptionMultiplier;
      }
      
      // Calculate value
      let value = 0;
      console.log('[DEBUG] Calculating value:', { redemptionType: settings.redemptionType, redemptionRate, points, orderTotal });
      if (settings.redemptionType === 'percentage') {
        // For percentage type: redemptionRate is points per $1
        // e.g., 100 points = $1 when redemptionRate = 100
        value = points / redemptionRate;
        console.log('[DEBUG] Percentage calculation:', { value, formula: `${points} / ${redemptionRate}` });
      } else {
        // For fixed type: redemptionRate is currency per point
        // e.g., $0.005 per point when redemptionRate = 0.005
        value = points * redemptionRate;
        console.log('[DEBUG] Fixed calculation:', { value, formula: `${points} * ${redemptionRate}` });
      }
      
      // Apply max points limit
      if (maxPoints && points > maxPoints) {
        points = maxPoints;
        value = points * redemptionRate;
      }
      
      // Apply max percentage limit
      if (maxPercentage && orderTotal > 0) {
        const maxValue = (orderTotal * maxPercentage) / 100;
        if (value > maxValue) {
          value = maxValue;
          points = Math.floor(value / redemptionRate);
        }
      }
      
      // Check minimum cart amount
      if (settings.minCartAmountForRedemption && orderTotal < settings.minCartAmountForRedemption) {
        return { value: 0, points: 0, error: `Minimum cart amount of R ${settings.minCartAmountForRedemption} required` };
      }
      
      return { value, points };
    } catch (error) {
      console.error('Error calculating redemption value:', error);
      return { value: 0, points: 0 };
    }
  }
  
  /**
   * Get top customers ranking
   */
  async getTopCustomers(limit = 10, period = 'all') {
    try {
      let dateFilter = {};
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { createdAt: { $gte: weekAgo } };
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { createdAt: { $gte: monthAgo } };
      }
      
      const topCustomers = await User.aggregate([
        {
          $match: {
            role: 'customer',
            loyaltyPointsBanned: false,
            ...(period !== 'all' ? {} : {})
          }
        },
        {
          $lookup: {
            from: 'loyaltypoints',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user', '$$userId'] },
                  isExpired: false,
                  points: { $gt: 0 },
                  ...dateFilter
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$points' }
                }
              }
            ],
            as: 'pointsData'
          }
        },
        {
          $addFields: {
            pointsEarned: {
              $ifNull: [{ $arrayElemAt: ['$pointsData.total', 0] }, 0]
            }
          }
        },
        {
          $sort: { pointsEarned: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            loyaltyPoints: 1,
            pointsEarned: 1,
            totalSpent: 1,
            orderCount: 1,
            currentLoyaltyLevel: 1
          }
        }
      ]);
      
      return topCustomers;
    } catch (error) {
      console.error('Error getting top customers:', error);
      return [];
    }
  }
}

module.exports = new LoyaltyService();
