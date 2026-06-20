const express = require('express');
const router = express.Router();
const { Trip, Driver, Expense, Settlement, AuditLog, User, sequelize } = require('../models');
const { protect, admin } = require('../middleware/auth');
const { Op } = require('sequelize');

// @desc    Get dashboard metrics (Admin only)
// @route   GET /api/reports/dashboard-stats
// @access  Private/Admin
router.get('/dashboard-stats', protect, admin, async (req, res) => {
  try {
    const totalDrivers = await Driver.count({ where: { status: 'active' } });
    const totalTrips = await Trip.count();
    const activeTrips = await Trip.count({ where: { status: 'active' } });
    const completedTrips = await Trip.count({ where: { status: 'completed' } });
    
    // Settlement counts
    const pendingSettlements = await Settlement.count({ where: { status: 'pending' } });
    const approvedSettlements = await Settlement.count({ where: { status: 'approved' } });

    // Sum of all approved expenses
    const expenses = await Expense.sum('amount', { where: { status: 'approved' } }) || 0;
    const totalExpenses = parseFloat(expenses);

    // Get breakdown of expenses by category for charts
    const categoryBreakdown = await Expense.findAll({
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: { status: 'approved' },
      group: ['category'],
      raw: true
    });

    // Get recent activity (audit logs)
    const recentActivity = await AuditLog.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
    });

    res.json({
      totalDrivers,
      totalTrips,
      activeTrips,
      completedTrips,
      pendingSettlements,
      approvedSettlements,
      totalExpenses,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        total: parseFloat(item.total)
      })),
      recentActivity
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get driver expense report
// @route   GET /api/reports/driver-summary
// @access  Private/Admin
router.get('/driver-summary', protect, admin, async (req, res) => {
  try {
    // We want to list all drivers, the number of trips they took, their total advances, and their total approved expenses
    const drivers = await Driver.findAll({
      include: [
        {
          model: Trip,
          as: 'trips',
          include: [
            { model: Expense, as: 'expenses', where: { status: 'approved' }, required: false },
            { model: Settlement, as: 'settlement', required: false }
          ]
        }
      ]
    });

    const driverReport = drivers.map(driver => {
      let totalTrips = driver.trips.length;
      let totalAdvances = driver.trips.reduce((sum, trip) => sum + parseFloat(trip.advanceAmount), 0);
      
      let totalApprovedExpenses = 0;
      driver.trips.forEach(trip => {
        if (trip.expenses) {
          trip.expenses.forEach(exp => {
            totalApprovedExpenses += parseFloat(exp.amount);
          });
        }
      });

      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        totalTrips,
        totalAdvances,
        totalApprovedExpenses,
        balance: totalApprovedExpenses - totalAdvances
      };
    });

    res.json(driverReport);
  } catch (error) {
    console.error('Fetch driver summary report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get trip settlement report
// @route   GET /api/reports/trip-settlements
// @access  Private/Admin
router.get('/trip-settlements', protect, admin, async (req, res) => {
  try {
    const trips = await Trip.findAll({
      include: [
        { model: Driver, as: 'driver', attributes: ['name'] },
        { model: Settlement, as: 'settlement' },
        { model: Expense, as: 'expenses' }
      ],
      order: [['startDate', 'DESC']]
    });

    const tripReport = trips.map(trip => {
      const allExpenses = trip.expenses || [];
      const approvedExpenses = allExpenses.filter(e => e.status === 'approved');
      
      const totalLoggedExpenses = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      return {
        id: trip.id,
        destination: trip.destination,
        driverName: trip.driver?.name || 'Unassigned',
        startDate: trip.startDate,
        endDate: trip.endDate,
        vehicleNumber: trip.vehicleNumber,
        advanceAmount: parseFloat(trip.advanceAmount),
        totalLoggedExpenses,
        totalApprovedExpenses,
        balance: totalApprovedExpenses - parseFloat(trip.advanceAmount),
        status: trip.status,
        settlementStatus: trip.settlement?.status || 'Not Submitted',
        remarks: trip.settlement?.remarks || ''
      };
    });

    res.json(tripReport);
  } catch (error) {
    console.error('Fetch trip settlements report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get monthly expense trends (last 6 months)
// @route   GET /api/reports/monthly-trends
// @access  Private/Admin
router.get('/monthly-trends', protect, admin, async (req, res) => {
  try {
    // For simplicity, we can fetch all approved expenses and group them in JS by Month-Year
    // This makes the SQLite & MySQL implementation perfectly identical and portable
    const expenses = await Expense.findAll({
      where: { status: 'approved' },
      attributes: ['amount', 'date'],
      order: [['date', 'ASC']]
    });

    const trips = await Trip.findAll({
      attributes: ['advanceAmount', 'startDate'],
      order: [['startDate', 'ASC']]
    });

    const monthlyData = {};

    // Group expenses
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { month: monthYear, expenses: 0, advances: 0 };
      }
      monthlyData[monthYear].expenses += parseFloat(exp.amount);
    });

    // Group advances
    trips.forEach(trip => {
      const date = new Date(trip.startDate);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { month: monthYear, expenses: 0, advances: 0 };
      }
      monthlyData[monthYear].advances += parseFloat(trip.advanceAmount);
    });

    // Convert to sorted array
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      return new Date(a.month) - new Date(b.month);
    });

    // Limit to last 6 months
    res.json(sortedData.slice(-6));
  } catch (error) {
    console.error('Fetch monthly trends error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get audit logs
// @route   GET /api/reports/audit-logs
// @access  Private/Admin
router.get('/audit-logs', protect, admin, async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
