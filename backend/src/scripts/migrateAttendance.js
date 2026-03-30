const mongoose = require('mongoose');
require('dotenv').config();

async function migrateAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const AttendanceModel = mongoose.model('Attendance', new mongoose.Schema({
      employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
      date: { type: String, required: true },
      start_time: { type: Date, required: true },
      end_time: { type: Date, default: null },
      total_hours: { type: Number, default: 0 }
    }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

    console.log('Migration started...');

    const records = await AttendanceModel.find({});
    console.log(`Found ${records.length} records`);

    for (const record of records) {
      let needsSave = false;

      if (record.check_in_time && !record.start_time) {
        record.start_time = record.check_in_time;
        needsSave = true;
      }

      if (record.check_out_time && !record.end_time) {
        record.end_time = record.check_out_time;
        needsSave = true;
      }

      if (record.working_hours && !record.total_hours) {
        record.total_hours = record.working_hours;
        needsSave = true;
      }

      if (!record.date && record.start_time) {
        record.date = new Date(record.start_time).toISOString().split('T')[0];
        needsSave = true;
      }

      if (needsSave) {
        await record.save();
        console.log(`Updated record ${record._id}`);
      }
    }

    console.log('Removing old fields...');
    await AttendanceModel.updateMany({}, {
      $unset: {
        check_in_time: 1,
        check_out_time: 1,
        check_in_lat: 1,
        check_in_lng: 1,
        check_out_lat: 1,
        check_out_lng: 1,
        working_hours: 1,
        status: 1
      }
    });
    console.log('Old fields removed');

    console.log('Creating unique index on (employee_id, date)...');
    try {
      await AttendanceModel.collection.createIndex(
        { employee_id: 1, date: 1 },
        { unique: true, background: true }
      );
      console.log('Unique index created successfully');
    } catch (indexError) {
      if (indexError.code === 85 || indexError.code === 86 || indexError.code === 11000) {
        console.log('Index exists or duplicates found. Cleaning...');
        const duplicates = await AttendanceModel.aggregate([
          { $group: { _id: { employee_id: '$employee_id', date: '$date' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
          { $match: { count: { $gt: 1 } } }
        ]);
        for (const dup of duplicates) {
          const idsToDelete = dup.ids.slice(1);
          await AttendanceModel.deleteMany({ _id: { $in: idsToDelete } });
          console.log(`Deleted ${idsToDelete.length} duplicates for ${dup._id.date}`);
        }
        await AttendanceModel.collection.createIndex({ employee_id: 1, date: 1 }, { unique: true, background: true });
        console.log('Unique index created after cleanup');
      } else {
        throw indexError;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateAttendance();
