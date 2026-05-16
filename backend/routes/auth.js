const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect, generateToken, sendTokenResponse } = require('../middleware/auth');
const User = require('../models/User');
const emailService = require('../services/emailService');

// @route   POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = req.body;
    const user = await User.create({ email, password, firstName, lastName, phone });

    // Handle coupon email automation for new users
    const couponEmailService = require('../services/couponEmailService');
    couponEmailService.handleNewUser(user._id).catch(err => {
      console.error('Error handling new user coupon:', err);
    });

    // Award signup bonus PESA Coins
    const loyaltyService = require('../services/loyaltyService');
    loyaltyService.awardExtraPoints(user._id, 'signup').catch(err => {
      console.error('Error awarding signup bonus:', err);
    });

    // Handle referral attribution if a code was supplied
    if (referralCode) {
      const referralService = require('../services/referralService');
      referralService.handleSignup(user, String(referralCode).toUpperCase(), {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Referral signup error:', err));
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    user.lastLoginDate = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/admin/login
// @desc    Admin panel login — customers are rejected
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const adminRoles = ['admin', 'shop_manager', 'superadmin', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    user.lastLoginDate = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @route   POST /api/auth/google
// @desc    Login/Register with Google ID token
// @access  Public
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    const googleConfig = settings.socialLogin?.google;

    if (!googleConfig?.enabled || !googleConfig?.clientId) {
      return res.status(400).json({ success: false, message: 'Google login is not configured' });
    }

    // Verify the Google ID token
    const { OAuth2Client } = require('google-auth-library');
    // Build audience list: web client ID + mobile client ID (if configured separately)
    const audiences = [googleConfig.clientId];
    if (googleConfig.mobileClientId && googleConfig.mobileClientId !== googleConfig.clientId) {
      audiences.push(googleConfig.mobileClientId);
    }
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: audiences,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email.toLowerCase() });
    let isNewUser = false;
    if (!user) {
      user = await User.create({
        email: payload.email.toLowerCase(),
        firstName: payload.given_name || payload.name?.split(' ')[0] || 'User',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
        password: require('crypto').randomBytes(32).toString('hex'),
        isEmailVerified: payload.email_verified || false,
      });
      isNewUser = true;
    }

    user.lastLogin = new Date();
    user.lastLoginDate = new Date();
    await user.save({ validateBeforeSave: false });

    // Award signup bonus for new social login users
    if (isNewUser) {
      const loyaltyService = require('../services/loyaltyService');
      loyaltyService.awardExtraPoints(user._id, 'signup').catch(err => {
        console.error('Error awarding signup bonus:', err);
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google auth error:', error.message);
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      return res.status(401).json({ success: false, message: 'Google token expired or invalid. Please try again.' });
    }
    next(error);
  }
});

// @route   POST /api/auth/facebook
// @desc    Login/Register with Facebook access token
// @access  Public
router.post('/facebook', async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Facebook access token is required' });
    }

    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    const fbConfig = settings.socialLogin?.facebook;

    if (!fbConfig?.enabled || !fbConfig?.appId) {
      return res.status(400).json({ success: false, message: 'Facebook login is not configured' });
    }

    // Verify the Facebook access token by calling Facebook's Graph API
    const https = require('https');
    const fbUser = await new Promise((resolve, reject) => {
      https.get(`https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${accessToken}`, (resp) => {
        let data = '';
        resp.on('data', chunk => data += chunk);
        resp.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new Error(parsed.error.message));
            else resolve(parsed);
          } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    if (!fbUser || !fbUser.email) {
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Facebook. Please ensure your Facebook account has a verified email.' });
    }

    // Find or create user
    let user = await User.findOne({ email: fbUser.email.toLowerCase() });
    let isNewUser = false;
    if (!user) {
      user = await User.create({
        email: fbUser.email.toLowerCase(),
        firstName: fbUser.first_name || 'User',
        lastName: fbUser.last_name || '',
        password: require('crypto').randomBytes(32).toString('hex'),
        isEmailVerified: true,
      });
      isNewUser = true;
    }

    user.lastLogin = new Date();
    user.lastLoginDate = new Date();
    await user.save({ validateBeforeSave: false });

    // Award signup bonus for new social login users
    if (isNewUser) {
      const loyaltyService = require('../services/loyaltyService');
      loyaltyService.awardExtraPoints(user._id, 'signup').catch(err => {
        console.error('Error awarding signup bonus:', err);
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Facebook auth error:', error.message);
    next(error);
  }
});

// @route   PUT /api/auth/update
router.put('/update', protect, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, currentPassword, password } = req.body;

    // If changing password, verify current password first
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const userWithPassword = await User.findById(req.user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      userWithPassword.password = password;
      if (firstName !== undefined) userWithPassword.firstName = firstName;
      if (lastName !== undefined) userWithPassword.lastName = lastName;
      if (phone !== undefined) userWithPassword.phone = phone;
      if (email !== undefined) userWithPassword.email = email;
      await userWithPassword.save();
      const updated = await User.findById(req.user._id);
      return res.json({ success: true, data: updated });
    }

    // Regular profile update (no password change)
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── ADDRESS MANAGEMENT ─────────────────────────────────────────────

// @route   GET /api/auth/addresses
router.get('/addresses', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.addresses || [] });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/addresses
router.post('/addresses', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { type, firstName, lastName, company, street, street2, city, state, country, postalCode, phone, isDefault } = req.body;

    if (!type || !firstName || !lastName || !street || !city || !state || !country || !postalCode) {
      return res.status(400).json({ success: false, message: 'Required fields: type, firstName, lastName, street, city, state, country, postalCode' });
    }

    const newAddress = { type, firstName, lastName, company, street, street2, city, state, country, postalCode, phone, isDefault: isDefault || false };

    // If setting as default, unset other defaults of same type
    if (newAddress.isDefault) {
      user.addresses.forEach(a => {
        if (a.type === type) a.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/addresses/:addressId
router.put('/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const fields = ['type', 'firstName', 'lastName', 'company', 'street', 'street2', 'city', 'state', 'country', 'postalCode', 'phone', 'isDefault'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) address[f] = req.body[f];
    });

    // If setting as default, unset other defaults of same type
    if (address.isDefault) {
      user.addresses.forEach(a => {
        if (a._id.toString() !== address._id.toString() && a.type === address.type) {
          a.isDefault = false;
        }
      });
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/auth/addresses/:addressId
router.delete('/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    address.deleteOne();
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

// ─── WISHLIST MANAGEMENT ────────────────────────────────────────────

// @route   GET /api/auth/wishlist
router.get('/wishlist', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name slug featuredImage images regularPrice salePrice stock');
    res.json({ success: true, data: user.wishlist || [] });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/wishlist
router.post('/wishlist', protect, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    const user = await User.findById(req.user._id);
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    const updated = await User.findById(req.user._id).populate('wishlist', 'name slug featuredImage images regularPrice salePrice stock');
    res.json({ success: true, data: updated.wishlist });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/auth/wishlist/:productId
router.delete('/wishlist/:productId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    const updated = await User.findById(req.user._id).populate('wishlist', 'name slug featuredImage images regularPrice salePrice stock');
    res.json({ success: true, data: updated.wishlist });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Build reset URL (works for both frontend and admin panel)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001';
    const isAdmin = ['admin', 'manager', 'shop_manager'].includes(user.role);
    const baseUrl = isAdmin ? adminUrl : frontendUrl;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.firstName || user.name || 'there'},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#1b5e35;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">Reset Password</a></p>
          <p>This link will expire in 30 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Error sending reset email:', emailErr);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again later.' });
    }

    res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Please provide token and new password' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
