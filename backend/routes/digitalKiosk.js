const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const DigitalKioskConfig = require('../models/DigitalKioskConfig');

async function getConfig() {
  let config = await DigitalKioskConfig.findOne();
  if (!config) config = await DigitalKioskConfig.create({});
  return config;
}

function mergeDeviceOverrides(configObj, deviceId) {
  if (!deviceId || !Array.isArray(configObj.devices)) return configObj;
  const device = configObj.devices.find(d => d.deviceId === deviceId);
  if (!device || !device.overrides || typeof device.overrides !== 'object') return configObj;
  const overrides = device.overrides;
  const merged = { ...configObj };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== undefined && overrides[key] !== null) {
      merged[key] = overrides[key];
    }
  }
  return merged;
}

// ─── Public: Kiosk client fetches its config (with optional per-device overrides) ─
router.get('/config', async (req, res) => {
  try {
    const config = await getConfig();
    const populated = await DigitalKioskConfig.findById(config._id)
      .populate('featuredCategories', 'name slug image icon iconImage bannerImage productCount')
      .populate('featuredProducts', 'name slug featuredImage images regularPrice salePrice stock');
    const obj = populated.toObject();
    const merged = mergeDeviceOverrides(obj, req.query.deviceId);
    // Don't ship full devices array to public clients
    delete merged.devices;
    res.json({ success: true, data: merged });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Get full config ─────────────────────────────────────
router.get('/config/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getConfig();
    const populated = await DigitalKioskConfig.findById(config._id)
      .populate('featuredCategories', 'name slug image')
      .populate('featuredProducts', 'name slug featuredImage regularPrice salePrice');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Update config (any subset of fields) ────────────────
router.put('/config', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getConfig();
    const allowed = [
      'screensaverEnabled', 'screensaverMedia', 'idleTimeoutSeconds', 'autoLogoutSeconds',
      'branding', 'signup', 'featuredCategories', 'featuredProducts',
      'welcomeHeading', 'welcomeSubheading', 'successAutoReturnSeconds',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        config[key] = req.body[key];
        config.markModified(key);
      }
    }
    await config.save();
    const populated = await DigitalKioskConfig.findById(config._id)
      .populate('featuredCategories', 'name slug image')
      .populate('featuredProducts', 'name slug featuredImage regularPrice salePrice');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Public: Register a kiosk device (idempotent on deviceId) ───
router.post('/devices', async (req, res) => {
  try {
    const { deviceId, userAgent, screenWidth, screenHeight, name, location } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, message: 'deviceId required' });
    const config = await getConfig();
    let device = config.devices.find(d => d.deviceId === deviceId);
    if (!device) {
      config.devices.push({
        deviceId,
        name: name || `Kiosk ${config.devices.length + 1}`,
        location: location || '',
        userAgent: userAgent || '',
        screenWidth: screenWidth || 0,
        screenHeight: screenHeight || 0,
        lastHeartbeat: new Date(),
      });
    } else {
      if (userAgent) device.userAgent = userAgent;
      if (screenWidth) device.screenWidth = screenWidth;
      if (screenHeight) device.screenHeight = screenHeight;
      device.lastHeartbeat = new Date();
    }
    await config.save();
    const saved = config.devices.find(d => d.deviceId === deviceId);
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Public: Heartbeat (called every 60s by each kiosk) ─────────
router.post('/devices/:deviceId/heartbeat', async (req, res) => {
  try {
    const config = await getConfig();
    const device = config.devices.find(d => d.deviceId === req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, message: 'Device not registered' });
    device.lastHeartbeat = new Date();
    await config.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Update a device (name/location/overrides/active) ────
router.put('/devices/:deviceId', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getConfig();
    const device = config.devices.find(d => d.deviceId === req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    const fields = ['name', 'location', 'overrides', 'active'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) device[f] = req.body[f];
    });
    config.markModified('devices');
    await config.save();
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Delete a device ─────────────────────────────────────
router.delete('/devices/:deviceId', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getConfig();
    const before = config.devices.length;
    config.devices = config.devices.filter(d => d.deviceId !== req.params.deviceId);
    if (config.devices.length === before) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    await config.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
