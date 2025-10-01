// routes/devices.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();

// Temporary mock middleware (remove when you create real middleware)
const auth = (req, res, next) => {
  req.user = { id: 1, name: 'Test User', role: 'admin' };
  next();
};

const validateDeviceCreate = (req, res, next) => {
  const { name, model, location, power } = req.body;
  if (!name || !model || !location || !power) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, model, location, power'
    });
  }
  next();
};

const validateDeviceId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid device ID'
    });
  }
  next();
};

const validateDeviceStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || (status !== 'ON' && status !== 'OFF')) {
    return res.status(400).json({
      success: false,
      error: 'Status must be ON or OFF'
    });
  }
  next();
};

// GET all devices - Protected route
router.get('/', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const devices = await Device.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices'
    });
  }
});

// GET a specific device - Protected route
router.get('/:id', auth, validateDeviceId, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const device = await Device.findByPk(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      device
    });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device'
    });
  }
});

// POST create a new device - Protected route
router.post('/', auth, validateDeviceCreate, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const { name, model, location, power, status = 'OFF', icon } = req.body;

    // Check if device with same name already exists
    const existingDevice = await Device.findOne({ where: { name } });
    if (existingDevice) {
      return res.status(409).json({
        success: false,
        error: 'Device with this name already exists'
      });
    }

    const device = await Device.create({
      name,
      model,
      location,
      power,
      status,
      icon
    });

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      device
    });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create device'
    });
  }
});

// PUT update a device - Protected route
router.put('/:id', auth, validateDeviceId, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const device = await Device.findByPk(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { name, model, location, power, status, icon } = req.body;

    // Check for duplicate name (if name is being updated)
    if (name && name !== device.name) {
      const existingDevice = await Device.findOne({ where: { name } });
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          error: 'Device with this name already exists'
        });
      }
    }

    // Update device
    await device.update({
      name: name || device.name,
      model: model || device.model,
      location: location || device.location,
      power: power || device.power,
      status: status || device.status,
      icon: icon || device.icon
    });

    res.json({
      success: true,
      message: 'Device updated successfully',
      device
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device'
    });
  }
});

// PATCH update device status - Protected route
router.patch('/:id/status', auth, validateDeviceId, validateDeviceStatus, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const device = await Device.findByPk(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { status } = req.body;

    await device.update({ status });

    res.json({
      success: true,
      message: `Device ${status === 'ON' ? 'turned on' : 'turned off'} successfully`,
      device
    });
  } catch (error) {
    console.error('Update device status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status'
    });
  }
});

// DELETE a device - Protected route
router.delete('/:id', auth, validateDeviceId, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const device = await Device.findByPk(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    await device.destroy();

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete device'
    });
  }
});

// GET device statistics - Protected route
router.get('/:id/stats', auth, validateDeviceId, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Device } = models;
    
    const device = await Device.findByPk(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Mock statistics
    const stats = {
      totalUptime: '95%',
      energyConsumed: '45.2 kWh',
      averageUsage: '2.1 kWh/day',
      lastMaintenance: '2024-01-15',
      performance: 'Excellent'
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device statistics'
    });
  }
});

module.exports = router;