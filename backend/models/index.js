const User = require('./User');
const Driver = require('./Driver');
const Trip = require('./Trip');
const Expense = require('./Expense');
const Settlement = require('./Settlement');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const sequelize = require('../config/database');

// User <-> Driver relationship (for logins)
User.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile' });
Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Driver <-> Trip relationship
Driver.hasMany(Trip, { foreignKey: 'driverId', as: 'trips' });
Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Trip <-> Expense relationship
Trip.hasMany(Expense, { foreignKey: 'tripId', as: 'expenses' });
Expense.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// Trip <-> Settlement relationship
Trip.hasOne(Settlement, { foreignKey: 'tripId', as: 'settlement' });
Settlement.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// User <-> Notification relationship
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> AuditLog relationship
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Driver,
  Trip,
  Expense,
  Settlement,
  Notification,
  AuditLog,
};
