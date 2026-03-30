const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const collection = db.collection('attendances');

  const records = await collection.find({}).toArray();
  console.log('Found', records.length, 'records');

  for (const r of records) {
    console.log('Before:', { _id: r._id, start_time: r.start_time, check_in_time: r.check_in_time });

    const update = { $set: {}, $unset: {} };

    if (r.check_in_time) {
      update.$set.start_time = r.check_in_time;
    }
    if (r.check_out_time) {
      update.$set.end_time = r.check_out_time;
    }

    update.$unset = {
      check_in_time: '',
      check_out_time: '',
      check_in_lat: '',
      check_in_lng: '',
      check_out_lat: '',
      check_out_lng: '',
      working_hours: '',
      status: ''
    };

    await collection.updateOne({ _id: r._id }, update);
    console.log('Updated:', r._id);
  }

  console.log('\nFinal records:');
  const final = await collection.find({}).toArray();
  final.forEach(r => {
    console.log({
      _id: r._id,
      start_time: r.start_time,
      end_time: r.end_time,
      total_hours: r.total_hours
    });
  });

  await mongoose.disconnect();
  console.log('\nDisconnected');
}

fix();
