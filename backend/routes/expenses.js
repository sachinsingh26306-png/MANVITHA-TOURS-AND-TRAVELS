const express = require('express');
const router = express.Router();
const { Expense, Trip, Driver, User, Notification, AuditLog } = require('../models');
const { protect, admin } = require('../middleware/auth');
const { upload, handleReceiptUpload } = require('../middleware/upload');

// @desc    Add an expense to an active/completed trip
// @route   POST /api/expenses
// @access  Private (Driver only, though Admin can too)
router.post('/', protect, upload.single('receipt'), handleReceiptUpload, async (req, res) => {
  const { tripId, category, amount, date, description } = req.body;

  try {
    const trip = await Trip.findByPk(tripId, {
      include: [{ model: Driver, as: 'driver' }]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is the driver assigned to this trip
    if (req.user.role !== 'admin' && req.user.driverProfile?.id !== trip.driverId) {
      return res.status(403).json({ message: 'You are not assigned to this trip' });
    }

    if (trip.status === 'settled') {
      return res.status(400).json({ message: 'Cannot add expenses to a settled trip' });
    }

    const expense = await Expense.create({
      tripId,
      category,
      amount,
      date,
      description,
      receiptUrl: req.receiptUrl || null, // URL from handleReceiptUpload middleware
      status: 'pending'
    });

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'EXPENSE_ADD',
      details: `Added ${category} expense of ₹${amount} to trip ${trip.id}`,
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all pending expenses for Admin review
// @route   GET /api/expenses/pending
// @access  Private/Admin
router.get('/pending', protect, admin, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { status: 'pending' },
      include: [{
        model: Trip,
        as: 'trip',
        include: [{ model: Driver, as: 'driver', attributes: ['name'] }]
      }],
      order: [['date', 'ASC']]
    });
    res.json(expenses);
  } catch (error) {
    console.error('Fetch pending expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Approve or Reject an expense
// @route   PUT /api/expenses/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [{
        model: Trip,
        as: 'trip',
        include: [{ model: Driver, as: 'driver' }]
      }]
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.trip.status === 'settled') {
      return res.status(400).json({ message: 'Cannot verify expenses for a settled trip' });
    }

    expense.status = status;
    await expense.save();

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: `EXPENSE_${status.toUpperCase()}`,
      details: `Expense ID: ${expense.id} of ₹${expense.amount} was ${status}`,
    });

    // Notify Driver
    const driverUser = expense.trip.driver;
    if (driverUser && driverUser.userId) {
      await Notification.create({
        userId: driverUser.userId,
        message: `Your ₹${expense.amount} expense for ${expense.category} (Trip to ${expense.trip.destination}) was ${status}.`,
      });
    }

    res.json(expense);
  } catch (error) {
    console.error('Verify expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete an expense (Driver only, and only if pending)
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only assigned driver or admin can delete
    if (req.user.role !== 'admin' && req.user.driverProfile?.id !== expense.trip.driverId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only delete if pending
    if (expense.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot delete an already approved/rejected expense' });
    }

    if (expense.trip.status === 'settled') {
      return res.status(400).json({ message: 'Cannot delete expenses on a settled trip' });
    }

    await expense.destroy();

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'EXPENSE_DELETE',
      details: `Deleted expense ID: ${expense.id}`,
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
