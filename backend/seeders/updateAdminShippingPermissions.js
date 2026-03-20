const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

const updateAdminShippingPermissions = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users`);

    // Update admin role to ensure it has all shipping permissions
    const adminRole = await Role.findOne({ slug: 'admin' });
    if (adminRole) {
      // Define all shipping permissions with full access
      const shippingResources = [
        'shipping_waybills',
        'shipping_photos', 
        'shipping_scanout',
        'shipping_scanin',
        'shipping_pod',
        'shipping_reports',
        'shipping_hubs'
      ];

      let updated = false;
      shippingResources.forEach(resource => {
        const existingPerm = adminRole.permissions.find(p => p.resource === resource);
        if (!existingPerm) {
          adminRole.permissions.push({
            resource,
            create: true,
            read: true,
            update: true,
            delete: true
          });
          updated = true;
        } else {
          // Ensure full permissions
          existingPerm.create = true;
          existingPerm.read = true;
          existingPerm.update = true;
          existingPerm.delete = true;
          updated = true;
        }
      });

      if (updated) {
        await adminRole.save();
        console.log('Updated admin role with full shipping permissions');
      }
    }

    // Also update shop_manager role
    const managerRole = await Role.findOne({ slug: 'shop_manager' });
    if (managerRole) {
      const shippingResources = [
        'shipping_waybills',
        'shipping_photos', 
        'shipping_scanout',
        'shipping_scanin',
        'shipping_pod',
        'shipping_reports',
        'shipping_hubs'
      ];

      let updated = false;
      shippingResources.forEach(resource => {
        const existingPerm = managerRole.permissions.find(p => p.resource === resource);
        if (!existingPerm) {
          managerRole.permissions.push({
            resource,
            create: true,
            read: true,
            update: true,
            delete: resource === 'shipping_hubs' ? false : true
          });
          updated = true;
        }
      });

      if (updated) {
        await managerRole.save();
        console.log('Updated shop_manager role with shipping permissions');
      }
    }

    console.log('Permissions update completed successfully');
    console.log('Please restart your admin panel session to apply the new permissions');
    process.exit(0);
  } catch (error) {
    console.error('Error updating permissions:', error);
    process.exit(1);
  }
};

updateAdminShippingPermissions();
