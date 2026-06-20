const express = require('express');
const router = express.Router();
const { Trip, Driver, User, Expense, Settlement, Notification, AuditLog } = require('../models');
const { protect, admin } = require('../middleware/auth');
const { Op } = require('sequelize');

// @desc    Get all trips (Admin sees all, Driver sees assigned only)
// @route   GET /api/trips
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    let whereClause = {};

    // Filter by driver if user is driver
    if (req.user.role === 'driver') {
      if (!req.user.driverProfile) {
        return res.json([]); // Driver has no profile details yet
      }
      whereClause.driverId = req.user.driverProfile.id;
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Search by destination or vehicle number
    if (search) {
      whereClause[Op.or] = [
        { destination: { [Op.like]: `%${search}%` } },
        { vehicleNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const trips = await Trip.findAll({
      where: whereClause,
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone', 'licenseNumber'] },
        { model: Settlement, as: 'settlement' }
      ],
      order: [['startDate', 'DESC']],
    });

    res.json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get single trip details (with expenses and settlement)
// @route   GET /api/trips/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [
        { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['id'] }] },
        { model: Expense, as: 'expenses' },
        { model: Settlement, as: 'settlement' }
      ]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check permissions (Admin can see all, Driver must be assigned)
    if (req.user.role !== 'admin' && req.user.driverProfile?.id !== trip.driverId) {
      return res.status(403).json({ message: 'Access denied to this trip' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Fetch trip detail error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create a new trip and assign to driver
// @route   POST /api/trips
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { driverId, destination, startDate, endDate, vehicleNumber, advanceAmount } = req.body;

  try {
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const trip = await Trip.create({
      driverId,
      destination,
      startDate,
      endDate,
      vehicleNumber,
      advanceAmount: advanceAmount || 0.00,
      status: 'pending'
    });

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'TRIP_CREATE',
      details: `Created trip to ${destination} for driver ${driver.name} (ID: ${trip.id})`,
    });

    // Notify driver if driver has user login
    if (driver.userId) {
      await Notification.create({
        userId: driver.userId,
        message: `New trip to ${destination} assigned to you starting on ${startDate}. Advance: ₹${advanceAmount}`,
      });
    }

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update a trip (destination, dates, vehicle, advance)
// @route   PUT /api/trips/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { driverId, destination, startDate, endDate, vehicleNumber, advanceAmount, status } = req.body;

  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.status === 'settled') {
      return res.status(400).json({ message: 'Cannot edit a settled trip' });
    }

    // If driver changed, notify the new driver
    const originalDriverId = trip.driverId;

    trip.driverId = driverId || trip.driverId;
    trip.destination = destination || trip.destination;
    trip.startDate = startDate || trip.startDate;
    trip.endDate = endDate || trip.endDate;
    trip.vehicleNumber = vehicleNumber || trip.vehicleNumber;
    trip.advanceAmount = advanceAmount !== undefined ? advanceAmount : trip.advanceAmount;
    trip.status = status || trip.status;

    await trip.save();

    // If driver was reassigned
    if (driverId && driverId !== originalDriverId) {
      const newDriver = await Driver.findByPk(driverId);
      if (newDriver && newDriver.userId) {
        await Notification.create({
          userId: newDriver.userId,
          message: `Trip to ${trip.destination} has been reassigned to you.`,
        });
      }
    }

    res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update trip status (Driver starting or ending a trip)
// @route   PUT /api/trips/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'active', 'completed', 'settled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: Driver, as: 'driver' }]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Role checks
    if (req.user.role !== 'admin' && req.user.driverProfile?.id !== trip.driverId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate state transitions
    if (req.user.role === 'driver') {
      // Driver can change pending -> active (start trip) and active -> completed (end trip)
      if (trip.status === 'pending' && status !== 'active') {
        return res.status(400).json({ message: 'Trip can only be started (set to active)' });
      }
      if (trip.status === 'active' && status !== 'completed') {
        return res.status(400).json({ message: 'Trip can only be completed (set to completed)' });
      }
      if (['completed', 'settled'].includes(trip.status)) {
        return res.status(400).json({ message: 'Drivers cannot alter completed or settled trips' });
      }
    }

    // Update status
    trip.status = status;
    await trip.save();

    // Notify other party
    if (req.user.role === 'driver') {
      // Notify Admin
      const admins = await User.findAll({ where: { role: 'admin' } });
      const activityMessage = status === 'active' 
        ? `Driver ${trip.driver.name} has STARTED trip to ${trip.destination}` 
        : `Driver ${trip.driver.name} has COMPLETED trip to ${trip.destination}. Awaiting settlement request.`;

      for (const adminUser of admins) {
        await Notification.create({
          userId: adminUser.id,
          message: activityMessage
        });
      }
    } else {
      // Admin changed status, notify driver
      if (trip.driver.userId) {
        await Notification.create({
          userId: trip.driver.userId,
          message: `Admin updated your trip to ${trip.destination} status to '${status}'.`
        });
      }
    }

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'TRIP_STATUS_CHANGE',
      details: `Trip ${trip.id} status changed to ${status}`,
    });

    res.json(trip);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
