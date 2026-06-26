const { sequelize, User, Driver, Trip, Expense, Settlement, Notification, AuditLog } = require('./models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Sync database and clear tables
    await sequelize.sync({ force: true });
    console.log('Database tables cleared and recreated.');

    // 1. Create Admins
    const adminUser = await User.create({
      name: 'Aditya Kumar (Admin)',
      email: 'admin@manivtha.com',
      password: 'admin123',
      role: 'admin',
      phone: '9876543200',
    });
    console.log('Seeded Admin User: admin@manivtha.com / admin123');

    // 2. Create Drivers (User accounts first, then Driver profiles)
    const driverUser1 = await User.create({
      name: 'Ramesh Shah',
      email: 'ramesh@manivtha.com',
      password: 'driver123',
      role: 'driver',
      phone: '9876543210',
    });

    const driverProfile1 = await Driver.create({
      name: 'Ramesh Shah',
      phone: '9876543210',
      licenseNumber: 'DL-1420180098765',
      status: 'active',
      userId: driverUser1.id,
    });

    const driverUser2 = await User.create({
      name: 'Suresh Patil',
      email: 'suresh@manivtha.com',
      password: 'driver123',
      role: 'driver',
      phone: '9876543211',
    });

    const driverProfile2 = await Driver.create({
      name: 'Suresh Patil',
      phone: '9876543211',
      licenseNumber: 'DL-1520190012345',
      status: 'active',
      userId: driverUser2.id,
    });

    const driverUser3 = await User.create({
      name: 'Vikram Singh',
      email: 'vikram@manivtha.com',
      password: 'driver123',
      role: 'driver',
      phone: '9876543212',
    });

    const driverProfile3 = await Driver.create({
      name: 'Vikram Singh',
      phone: '9876543212',
      licenseNumber: 'DL-1220170054321',
      status: 'active',
      userId: driverUser3.id,
    });

    console.log('Seeded 3 Drivers: ramesh@manivtha.com, suresh@manivtha.com, vikram@manivtha.com (Pass: driver123)');

    // 3. Create Trips
    // Trip 1: Ramesh - Bangalore to Goa (Settled)
    const trip1 = await Trip.create({
      driverId: driverProfile1.id,
      origin: 'Bangalore',
      destination: 'Goa',
      startDate: '2026-05-10',
      endDate: '2026-05-15',
      vehicleNumber: 'KA-51-MB-4321',
      advanceAmount: 15000.00,
      status: 'settled',
    });

    // Trip 2: Suresh - Bangalore to Chennai (Completed, Settlement Pending)
    const trip2 = await Trip.create({
      driverId: driverProfile2.id,
      origin: 'Bangalore',
      destination: 'Chennai',
      startDate: '2026-05-20',
      endDate: '2026-05-24',
      vehicleNumber: 'KA-03-MM-7890',
      advanceAmount: 10000.00,
      status: 'completed',
    });

    // Trip 3: Ramesh - Bangalore to Mumbai (Active/In-Progress)
    const trip3 = await Trip.create({
      driverId: driverProfile1.id,
      origin: 'Bangalore',
      destination: 'Mumbai',
      startDate: '2026-06-08',
      endDate: '2026-06-14',
      vehicleNumber: 'KA-51-MB-4321',
      advanceAmount: 20000.00,
      status: 'active',
    });

    // Trip 4: Vikram - Bangalore to Hyderabad (Pending/Upcoming)
    const trip4 = await Trip.create({
      driverId: driverProfile3.id,
      origin: 'Bangalore',
      destination: 'Hyderabad',
      startDate: '2026-06-15',
      endDate: '2026-06-18',
      vehicleNumber: 'KA-04-P-1122',
      advanceAmount: 8000.00,
      status: 'pending',
    });

    console.log('Seeded 4 Trips: Goa (Settled), Chennai (Completed), Mumbai (Active), Hyderabad (Pending)');

    // 4. Create Expenses
    // Trip 1 Expenses (Goa - All Approved)
    await Expense.create({
      tripId: trip1.id,
      category: 'fuel',
      amount: 8500.00,
      date: '2026-05-10',
      description: 'Diesel refuel at Shell bunk',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    await Expense.create({
      tripId: trip1.id,
      category: 'toll',
      amount: 1400.00,
      date: '2026-05-10',
      description: 'National Highway Fastag tolls',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    await Expense.create({
      tripId: trip1.id,
      category: 'accommodation',
      amount: 3500.00,
      date: '2026-05-12',
      description: 'Hotel room for 4 nights',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    await Expense.create({
      tripId: trip1.id,
      category: 'food',
      amount: 2200.00,
      date: '2026-05-13',
      description: 'Driver meals during trip',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });

    // Trip 2 Expenses (Chennai - Approved & Pending)
    const e2_1 = await Expense.create({
      tripId: trip2.id,
      category: 'fuel',
      amount: 6000.00,
      date: '2026-05-20',
      description: 'Diesel refill HP Petrol',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    const e2_2 = await Expense.create({
      tripId: trip2.id,
      category: 'toll',
      amount: 850.00,
      date: '2026-05-20',
      description: 'NH4 Toll Plaza charges',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    const e2_3 = await Expense.create({
      tripId: trip2.id,
      category: 'accommodation',
      amount: 2000.00,
      date: '2026-05-21',
      description: 'Lodge stay in Chennai',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    const e2_4 = await Expense.create({
      tripId: trip2.id,
      category: 'parking',
      amount: 400.00,
      date: '2026-05-22',
      description: 'Hotel parking charges',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'pending',
    });

    // Trip 3 Expenses (Mumbai - Active)
    await Expense.create({
      tripId: trip3.id,
      category: 'fuel',
      amount: 11000.00,
      date: '2026-06-08',
      description: 'Initial tank full diesel',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'approved',
    });
    await Expense.create({
      tripId: trip3.id,
      category: 'toll',
      amount: 1950.00,
      date: '2026-06-09',
      description: 'Toll charges enroute Mumbai',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      status: 'pending',
    });

    console.log('Seeded Expenses across trips.');

    // 5. Create Settlements
    // Settlement 1 (Goa - Approved)
    // total approved = 8500 + 1400 + 3500 + 2200 = 15600
    // advance = 15000
    // balance = 600 (Company pays driver)
    await Settlement.create({
      tripId: trip1.id,
      totalExpenses: 15600.00,
      advanceAmount: 15000.00,
      balance: 600.00,
      status: 'approved',
      remarks: 'All bills verified. Reimbursement of Rs 600 approved.',
    });

    // Settlement 2 (Chennai - Pending)
    // total approved so far = 6000 + 850 + 2000 = 8850
    // advance = 10000
    // balance = -1150 (Driver returns to company)
    await Settlement.create({
      tripId: trip2.id,
      totalExpenses: 8850.00,
      advanceAmount: 10000.00,
      balance: -1150.00,
      status: 'pending',
      remarks: '',
    });

    console.log('Seeded Settlements.');

    // 6. Create Notifications
    await Notification.create({
      userId: driverUser1.id,
      message: 'Your settlement request for Goa trip has been approved. ₹600 reimbursed.',
      isRead: true,
    });
    await Notification.create({
      userId: driverUser2.id,
      message: 'Please submit your settlement request for the completed Chennai trip.',
      isRead: false,
    });
    await Notification.create({
      userId: adminUser.id,
      message: 'New settlement request submitted by Suresh Patil (Chennai trip). Awaiting review.',
      isRead: false,
    });

    // 7. Create Audit Logs
    await AuditLog.create({
      userId: adminUser.id,
      action: 'SYSTEM_SETUP',
      details: 'Initial database seed completed.',
    });
    await AuditLog.create({
      userId: adminUser.id,
      action: 'TRIP_CREATE',
      details: 'Created and assigned Goa trip to Ramesh Shah.',
    });
    await AuditLog.create({
      userId: adminUser.id,
      action: 'SETTLEMENT_APPROVED',
      details: 'Approved Goa trip settlement. Balance of ₹600 reimbursed to Ramesh Shah.',
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
