const express = require('express');
const router = express.Router();
const { Driver, User, Trip, Settlement, sequelize } = require('../models');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all drivers with their associated user accounts
// @route   GET /api/drivers
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(drivers);
  } catch (error) {
    console.error('Fetch drivers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get driver profile by ID (including trips and settlements)
// @route   GET /api/drivers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['email', 'role'] },
        { 
          model: Trip, 
          as: 'trips',
          include: [{ model: Settlement, as: 'settlement' }],
          order: [['startDate', 'DESC']]
        }
      ],
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Allow drivers to view only their own profiles, while admins can view any
    if (req.user.role !== 'admin' && req.user.driverProfile?.id !== driver.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Fetch driver details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Add driver (and create companion User account for login)
// @route   POST /api/drivers
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { name, phone, licenseNumber, email, password, status } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // 1. If email is provided, create User account
    let userId = null;
    if (email) {
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Email is already registered to a user' });
      }

      const user = await User.create({
        name,
        email,
        password: password || 'driver123', // default password if none provided
        role: 'driver',
      }, { transaction });

      userId = user.id;
    }

    // 2. Create Driver Profile
    const driver = await Driver.create({
      name,
      phone,
      licenseNumber,
      status: status || 'active',
      userId,
    }, { transaction });

    await transaction.commit();

    res.status(201).json(driver);
  } catch (error) {
    await transaction.rollback();
    console.error('Create driver error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update driver profile and user credentials
// @route   PUT /api/drivers/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { name, phone, licenseNumber, email, password, status } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!driver) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update Driver Profile
    driver.name = name || driver.name;
    driver.phone = phone || driver.phone;
    driver.licenseNumber = licenseNumber || driver.licenseNumber;
    driver.status = status || driver.status;
    await driver.save({ transaction });

    // Update User account if it exists
    if (driver.user) {
      if (email && email !== driver.user.email) {
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
          await transaction.rollback();
          return res.status(400).json({ message: 'Email is already taken' });
        }
        driver.user.email = email;
      }
      driver.user.name = name || driver.user.name;
      if (password) {
        driver.user.password = password;
      }
      await driver.user.save({ transaction });
    } else if (email) {
      // If driver didn't have user, but email is provided now, create a user
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Email is already taken' });
      }

      const user = await User.create({
        name: driver.name,
        email,
        password: password || 'driver123',
        role: 'driver'
      }, { transaction });

      driver.userId = user.id;
      await driver.save({ transaction });
    }

    await transaction.commit();
    
    // Fetch fresh details to return
    const updatedDriver = await Driver.findByPk(driver.id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
    });

    res.json(updatedDriver);
  } catch (error) {
    await transaction.rollback();
    console.error('Update driver error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete driver and associated user login
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Delete associated User if exists
    if (driver.userId) {
      await User.destroy({ where: { id: driver.userId }, transaction });
    }

    // Delete Driver
    await driver.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'Driver and login account deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete driver error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
