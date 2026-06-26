const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Driver, AuditLog } = require('../models');
const { protect, admin } = require('../middleware/auth');
const { upload, handleReceiptUpload } = require('../middleware/upload');

// Helper to generate JWT
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '30d' }
  );
};

// @desc    Register a new user (Usually Admin setup or Driver login creation)
// @route   POST /api/auth/register
// @access  Private/Admin
router.post('/register', protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'driver',
    });

    // Write to audit logs
    await AuditLog.create({
      userId: user.id,
      action: 'USER_REGISTER',
      details: `User ${user.email} registered with role ${user.role}`,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Driver, as: 'driverProfile' }],
    });

    if (user && (await user.comparePassword(password))) {
      // Create audit log
      await AuditLog.create({
        userId: user.id,
        action: 'USER_LOGIN',
        details: `User logged in from IP ${req.ip}`,
      });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        driverProfile: user.driverProfile || null,
        token: generateToken(user),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @desc    Reset password (For demo purposes: directly update password if authorized or via admin)
// @route   POST /api/auth/reset-password
// @access  Private/Admin
router.post('/reset-password', protect, admin, async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Update password (hooks will hash it)
    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      userId: user.id,
      action: 'PASSWORD_RESET',
      details: 'Password was successfully reset',
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update user profile details (name, email, phone, avatar)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, upload.single('avatar'), handleReceiptUpload, async (req, res) => {
  const { name, email, phone, licenseNumber } = req.body;

  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Driver, as: 'driverProfile' }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email already exists for another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = email;
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    if (req.receiptUrl) {
      user.profileImageUrl = req.receiptUrl;
    }

    await user.save();

    // If driver, update the companion Driver profile details
    if (user.role === 'driver' && user.driverProfile) {
      user.driverProfile.name = name || user.driverProfile.name;
      user.driverProfile.phone = phone || user.driverProfile.phone;
      if (licenseNumber) {
        user.driverProfile.licenseNumber = licenseNumber;
      }
      await user.driverProfile.save();
    }

    // Fetch fresh details to return (excluding password)
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: user.role === 'driver' ? [{ model: Driver, as: 'driverProfile' }] : []
    });

    await AuditLog.create({
      userId: user.id,
      action: 'PROFILE_UPDATE',
      details: `User updated profile details. Name: ${name || user.name}`,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Change password (for logged in users)
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Update password (hooks will hash it)
    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      details: 'User successfully updated their password',
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

