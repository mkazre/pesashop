const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

const updateShippingPermissions = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define shipping permissions to add
    const shippingPermissions = [
      { resource: 'shipping_waybills', create: true, read: true, update: true, delete: true },
      { resource: 'shipping_photos', create: true, read: true, update: true, delete: true },
      { resource: 'shipping_scanout', create: true, read: true, update: false, delete: false },
      { resource: 'shipping_scanin', create: true, read: true, update: false, delete: false },
      { resource: 'shipping_pod', create: true, read: true, update: true, delete: true },
      { resource: 'shipping_reports', create: false, read: true, update: false, delete: false },
      { resource: 'shipping_hubs', create: true, read: true, update: true, delete: true }
    ];

    // Update admin role
    const adminRole = await Role.findOne({ slug: 'admin' });
    if (adminRole) {
      // Add all shipping permissions with full access
      shippingPermissions.forEach(perm => {
        const existingPerm = adminRole.permissions.find(p => p.resource === perm.resource);
        if (!existingPerm) {
          adminRole.permissions.push(perm);
        }
      });
      await adminRole.save();
      console.log('Updated admin role with shipping permissions');
    }

    // Update shop_manager role
    const managerRole = await Role.findOne({ slug: 'shop_manager' });
    if (managerRole) {
      // Add shipping permissions with limited delete access
      const managerPermissions = shippingPermissions.map(perm => ({
        ...perm,
        delete: perm.resource === 'shipping_hubs' ? false : perm.delete
      }));
      
      managerPermissions.forEach(perm => {
        const existingPerm = managerRole.permissions.find(p => p.resource === perm.resource);
        if (!existingPerm) {
          managerRole.permissions.push(perm);
        }
      });
      await managerRole.save();
      console.log('Updated shop_manager role with shipping permissions');
    }

    // Create dispatch_staff role if it doesn't exist
    let dispatchRole = await Role.findOne({ slug: 'dispatch_staff' });
    if (!dispatchRole) {
      dispatchRole = new Role({
        name: 'Dispatch Staff',
        slug: 'dispatch_staff',
        description: 'Staff responsible for shipping and logistics',
        permissions: [
          { resource: 'dashboard', create: false, read: true, update: false, delete: false },
          { resource: 'orders', create: false, read: true, update: false, delete: false },
          { resource: 'shipping_waybills', create: true, read: true, update: true, delete: false },
          { resource: 'shipping_photos', create: true, read: true, update: false, delete: false },
          { resource: 'shipping_scanout', create: true, read: true, update: false, delete: false },
          { resource: 'shipping_scanin', create: true, read: true, update: false, delete: false },
          { resource: 'shipping_pod', create: true, read: true, update: false, delete: false },
          { resource: 'shipping_reports', create: false, read: true, update: false, delete: false },
          { resource: 'shipping_hubs', create: false, read: true, update: false, delete: false }
        ]
      });
      await dispatchRole.save();
      console.log('Created dispatch_staff role with shipping permissions');
    }

    // Create delivery_driver role if it doesn't exist
    let driverRole = await Role.findOne({ slug: 'delivery_driver' });
    if (!driverRole) {
      driverRole = new Role({
        name: 'Delivery Driver',
        slug: 'delivery_driver',
        description: 'Delivery drivers and field staff',
        permissions: [
          { resource: 'dashboard', create: false, read: true, update: false, delete: false },
          { resource: 'shipping_waybills', create: false, read: true, update: false, delete: false },
          { resource: 'shipping_scanin', create: true, read: true, update: false, delete: false },
          { resource: 'shipping_pod', create: true, read: true, update: false, delete: false }
        ]
      });
      await driverRole.save();
      console.log('Created delivery_driver role with shipping permissions');
    }

    console.log('Shipping permissions update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating shipping permissions:', error);
    process.exit(1);
  }
};

updateShippingPermissions();
