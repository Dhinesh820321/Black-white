const mongoose = require('mongoose');
require('dotenv').config();

async function updateEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_management');
    
    const UserSchema = new mongoose.Schema({
      name: String,
      phone: String,
      password: String,
      role: String,
      status: String,
      branch_id: mongoose.Schema.Types.ObjectId
    }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const BranchSchema = new mongoose.Schema({
      name: String
    });
    
    const Branch = mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
    
    // Get a branch
    const branch = await Branch.findOne();
    if (!branch) {
      console.log('No branch found. Creating default branch...');
      const newBranch = await Branch.create({
        name: 'Main Branch',
        location: 'Default Location',
        geo_latitude: 28.6139,
        geo_longitude: 77.2090,
        geo_radius: 100,
        status: 'active'
      });
      console.log('Created branch:', newBranch._id);
      
      // Update employee with branch_id
      const result = await User.updateOne(
        { phone: '7777777777' },
        { $set: { branch_id: newBranch._id } }
      );
      console.log('Updated employee with branch_id:', result.modifiedCount > 0 ? 'Yes' : 'No');
    } else {
      console.log('Using branch:', branch.name, branch._id);
      
      // Update employee with branch_id
      const result = await User.updateOne(
        { phone: '7777777777' },
        { $set: { branch_id: branch._id } }
      );
      console.log('Updated employee with branch_id:', result.modifiedCount > 0 ? 'Yes' : 'No');
    }
    
    // Show updated employee
    const emp = await User.findOne({ phone: '7777777777' });
    console.log('Employee branch_id:', emp?.branch_id);
    
    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateEmployee();
