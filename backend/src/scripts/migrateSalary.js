const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const result = await users.updateMany(
    { salary: { $exists: false } },
    { $set: { salary: 0 } }
  );
  console.log(`Updated ${result.modifiedCount} users with default salary`);

  const sample = await users.findOne({ role: 'employee' });
  console.log('Sample employee:', {
    name: sample?.name,
    salary: sample?.salary,
    hasSalaryField: 'salary' in sample
  });

  await mongoose.disconnect();
  console.log('Done');
}

migrate();
