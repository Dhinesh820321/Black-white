const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    const Employee = mongoose.model('Employee');
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

    // Check if super admin exists
    const adminCount = await Employee.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Employee.create({
        employee_id: 'ADM001',
        name: 'Super Admin',
        role: 'admin',
        phone: '9999999999',
        password: 'admin123', // Model handles hashing
        branch_id: null,
        salary: 0,
        status: 'active'
      });
      console.log('🌱 Seeded: Super Admin');
    }

  } catch (error) {
    console.error('❌ Seeding Error:', error);
  }
};

module.exports = seedData;
