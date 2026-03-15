const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Role = require('../models/Role');
const User = require('../models/User');

// GET all roles
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, name: 1 }).lean();

    // Count users per role
    const userCounts = await User.aggregate([
      { $match: { role: { $in: ['admin', 'shop_manager', 'customer'] } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    userCounts.forEach(uc => { countMap[uc._id] = uc.count; });

    // Also count users with customRole references
    const customRoleCounts = await User.aggregate([
      { $match: { customRole: { $exists: true, $ne: null } } },
      { $group: { _id: '$customRole', count: { $sum: 1 } } },
    ]);
    customRoleCounts.forEach(uc => { countMap[uc._id?.toString()] = uc.count; });

    const enriched = roles.map(r => ({
      ...r,
      userCount: countMap[r.slug] || countMap[r._id?.toString()] || 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single role
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).lean();
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET available resources list
router.get('/meta/resources', protect, authorize('admin'), async (req, res) => {
  res.json({ success: true, data: Role.RESOURCES });
});

// POST create role
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.create({ name, description, permissions });
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A role with that name already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update role
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    // Prevent editing system role names
    if (role.isSystem && req.body.name && req.body.name !== role.name) {
      return res.status(400).json({ success: false, message: 'Cannot rename system roles' });
    }

    const { name, description, permissions, isActive } = req.body;
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();
    res.json({ success: true, data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A role with that name already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE role
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.isSystem) return res.status(400).json({ success: false, message: 'Cannot delete system roles' });

    // Check if any users are assigned this custom role
    const usersWithRole = await User.countDocuments({ customRole: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role: ${usersWithRole} user(s) are still assigned to it`,
      });
    }

    await role.deleteOne();
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST seed default system roles
router.post('/seed', protect, authorize('admin'), async (req, res) => {
  try {
    const RESOURCES = Role.RESOURCES;

    const defaults = [
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Full access to everything',
        isSystem: true,
        permissions: RESOURCES.map(r => ({ resource: r, create: true, read: true, update: true, delete: true })),
      },
      {
        name: 'Shop Manager',
        slug: 'shop_manager',
        description: 'Manage products, orders, and customers',
        isSystem: true,
        permissions: RESOURCES.map(r => {
          const restricted = ['users', 'roles', 'settings', 'code_snippets'];
          if (restricted.includes(r)) return { resource: r, create: false, read: false, update: false, delete: false };
          return { resource: r, create: true, read: true, update: true, delete: true };
        }),
      },
      {
        name: 'Customer',
        slug: 'customer',
        description: 'Default customer role with no admin access',
        isSystem: true,
        permissions: RESOURCES.map(r => ({ resource: r, create: false, read: false, update: false, delete: false })),
      },
    ];

    for (const def of defaults) {
      await Role.findOneAndUpdate(
        { slug: def.slug },
        { $set: def },
        { upsert: true, new: true }
      );
    }

    const roles = await Role.find().sort({ isSystem: -1, name: 1 });
    res.json({ success: true, data: roles, message: 'Default roles seeded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
