const express = require('express');
const router = express.Router();
const { Settlement, Trip, Expense, Driver, User, Notification, AuditLog } = require('../models');
const { protect, admin } = require('../middleware/auth');

// @desc    Submit a settlement request for a trip
// @route   POST /api/settlements
// @access  Private (Driver only)
router.post('/', protect, async (req, res) => {
  const { tripId } = req.body;

  try {
    const trip = await Trip.findByPk(tripId, {
      include: [
        { model: Driver, as: 'driver' },
        { model: Expense, as: 'expenses' }
      ]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && req.user.driverProfile?.id !== trip.driverId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (trip.status === 'settled') {
      return res.status(400).json({ message: 'Trip is already fully settled' });
    }

    // Calculate total approved expenses
    const approvedExpenses = trip.expenses.filter(e => e.status === 'approved');
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0.00);
    const advanceAmount = parseFloat(trip.advanceAmount);
    
    // balance = totalExpenses - advanceAmount
    // If balance > 0: company owes driver (payable)
    // If balance < 0: driver owes company (recoverable)
    const balance = totalExpenses - advanceAmount;

    // Check if settlement request already exists
    let settlement = await Settlement.findOne({ where: { tripId } });

    if (settlement) {
      if (settlement.status === 'approved') {
        return res.status(400).json({ message: 'Settlement has already been approved' });
      }
      // Update existing settlement
      settlement.totalExpenses = totalExpenses;
      settlement.advanceAmount = advanceAmount;
      settlement.balance = balance;
      settlement.status = 'pending';
      await settlement.save();
    } else {
      // Create new settlement
      settlement = await Settlement.create({
        tripId,
        totalExpenses,
        advanceAmount,
        balance,
        status: 'pending'
      });
    }

    // Set trip status to completed if it was active
    if (trip.status === 'active') {
      trip.status = 'completed';
      await trip.save();
    }

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'SETTLEMENT_SUBMIT',
      details: `Submitted settlement request for trip ${trip.id}. Expenses: ₹${totalExpenses}, Advance: ₹${advanceAmount}, Balance: ₹${balance}`,
    });

    // Notify Admins
    const admins = await User.findAll({ where: { role: 'admin' } });
    for (const adminUser of admins) {
      await Notification.create({
        userId: adminUser.id,
        message: `Settlement request submitted by ${trip.driver.name} for trip to ${trip.destination}. Balance: ₹${balance.toFixed(2)}`
      });
    }

    res.status(201).json(settlement);
  } catch (error) {
    console.error('Submit settlement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all settlements (Admin sees all, Driver sees their own)
// @route   GET /api/settlements
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'driver') {
      if (!req.user.driverProfile) {
        return res.json([]);
      }
      // Query trips assigned to this driver to filter settlements
      const driverTrips = await Trip.findAll({
        where: { driverId: req.user.driverProfile.id },
        attributes: ['id']
      });
      const tripIds = driverTrips.map(t => t.id);
      whereClause.tripId = tripIds;
    }

    const settlements = await Settlement.findAll({
      where: whereClause,
      include: [{
        model: Trip,
        as: 'trip',
        include: [{ model: Driver, as: 'driver', attributes: ['name', 'phone'] }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(settlements);
  } catch (error) {
    console.error('Fetch settlements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Approve or Reject settlement request
// @route   PUT /api/settlements/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  const { status, remarks } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const settlement = await Settlement.findByPk(req.params.id, {
      include: [{
        model: Trip,
        as: 'trip',
        include: [{ model: Driver, as: 'driver' }]
      }]
    });

    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    if (settlement.status === 'approved') {
      return res.status(400).json({ message: 'Settlement is already approved and locked' });
    }

    settlement.status = status;
    settlement.remarks = remarks || settlement.remarks;
    await settlement.save();

    // If approved, lock the trip status as 'settled'
    if (status === 'approved') {
      const trip = settlement.trip;
      trip.status = 'settled';
      await trip.save();
    }

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: `SETTLEMENT_${status.toUpperCase()}`,
      details: `Settlement ID: ${settlement.id} was ${status}. Remarks: ${remarks || 'None'}`,
    });

    // Notify Driver
    const driverUser = settlement.trip.driver;
    if (driverUser && driverUser.userId) {
      const balanceType = parseFloat(settlement.balance) >= 0 ? 'payable to you' : 'recoverable from you';
      const absBalance = Math.abs(parseFloat(settlement.balance)).toFixed(2);
      
      const message = status === 'approved'
        ? `Your settlement for trip to ${settlement.trip.destination} was APPROVED. Balance: ₹${absBalance} (${balanceType}).`
        : `Your settlement for trip to ${settlement.trip.destination} was REJECTED. Remarks: ${remarks || 'Please verify details'}`;

      await Notification.create({
        userId: driverUser.userId,
        message,
      });
    }

    res.json(settlement);
  } catch (error) {
    console.error('Process settlement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
