const Role = require('../models/Role');

/**
 * Check if user has permission for a specific resource and action
 */
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      // Get user's role
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Find the user's role with permissions
      const role = await Role.findOne({ slug: user.role });
      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'User role not found'
        });
      }

      // Check if the role has the required permission
      const permission = role.permissions.find(p => p.resource === resource);
      if (!permission || !permission[action]) {
        return res.status(403).json({
          success: false,
          message: `You do not have permission to ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

module.exports = checkPermission;
