const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    const User = mongoose.model('User');
    const Branch = mongoose.model('Branch');

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

  } catch (error) {
    console.error('❌ Seeding Error:', error);
  }
};

module.exports = seedData;
