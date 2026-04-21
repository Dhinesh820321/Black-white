const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    const User = mongoose.model('User');
    const Branch = mongoose.model('Branch');
    const Customer = mongoose.model('Customer');

    // Create unique index on Customer.phone
    try {
      await Customer.collection.createIndex({ phone: 1 }, { unique: true });
      console.log('✅ Customer phone index created/verified');
    } catch (err) {
      if (err.code !== 85 && err.code !== 86) {
        console.log('ℹ️ Customer phone index already exists');
      }
    }

    // CRITICAL: Reset ALL customers' last_visit and visit_count
    // This ensures correct "New Customer" vs "Active" distinction
    // New customer = visit_count <= 1 (0 or 1 visits = still "New")
    const resetResult = await Customer.updateMany(
      {},
      { $set: { last_visit: null, visit_count: 0 } }
    );
    console.log(`🧹 Reset last_visit & visit_count for ${resetResult.modifiedCount} customers`);

    // Check if any branches exist
    const branchCount = await Branch.countDocuments();
    let mainBranch;

    if (branchCount === 0) {
      mainBranch = await Branch.create({
        name: 'Main Branch - Downtown',
        location: '123 Main Street, Downtown',
        geo_latitude: 28.6139,
        geo_longitude: 77.2090,
        geo_radius: 100,
        status: 'active'
      });
      console.log('🌱 Seeded: Main Branch');
    } else {
      mainBranch = await Branch.findOne();
    }

    // Seed admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        name: 'Super Admin',
        phone: '9999999999',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      
      console.log('🌱 Seeded: Admin (phone: 9999999999, password: admin123)');
    } else {
      console.log('✅ Admin already exists');
    }

    // Seed employee
    const employeeCount = await User.countDocuments({ role: 'employee' });
    if (employeeCount === 0 && mainBranch) {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      
      await User.create({
        name: 'Test Employee',
        phone: '8888888888',
        password: hashedPassword,
        role: 'employee',
        branch_id: mainBranch._id,
        status: 'active',
        geo_lat: 28.6139,
        geo_long: 77.2090,
        geo_radius: 100
      });
      
      console.log('🌱 Seeded: Employee (phone: 8888888888, password: employee123)');
    }

    // Seed expense categories
    const ExpenseCategory = mongoose.model('ExpenseCategory');
    const categoryCount = await ExpenseCategory.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'Rent', description: 'Office/space rent expenses' },
        { name: 'Electricity', description: 'Electricity and utility bills' },
        { name: 'Supplies', description: 'Office and salon supplies' },
        { name: 'Equipment', description: 'Equipment purchase and repairs' },
        { name: 'Cleaning', description: 'Cleaning and hygiene supplies' },
        { name: 'Marketing', description: 'Advertising and marketing expenses' },
        { name: 'Misc', description: 'Miscellaneous expenses' }
      ];
      
      await ExpenseCategory.insertMany(defaultCategories);
      console.log('🌱 Seeded: Expense Categories');
    }

  } catch (error) {
    console.error('❌ Seeding Error:', error);
  }
};

module.exports = seedData;
