const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  date: { type: String, required: true },
  start_time: { type: Date },
  end_time: { type: Date },
  total_hours: { type: Number, default: 0, min: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

const AttendanceModel = mongoose.model('Attendance', attendanceSchema);

class Attendance {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) query.branch_id = filters.branch_id;
    if (filters.employee_id && mongoose.Types.ObjectId.isValid(filters.employee_id)) query.employee_id = filters.employee_id;
    if (filters.date) query.date = filters.date;

    return AttendanceModel.find(query)
      .populate('employee_id', 'name role')
      .populate('branch_id', 'name')
      .sort({ date: -1, start_time: -1 }).lean();
  }

  static async checkIn(employeeId, branchId) {
    const today = new Date().toISOString().slice(0, 10);
    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    const brId = typeof branchId === 'string' ? new mongoose.Types.ObjectId(branchId) : branchId;

    let attendance = await AttendanceModel.findOne({ employee_id: empId, date: today });

    if (!attendance) {
      attendance = await AttendanceModel.create({
        employee_id: empId,
        branch_id: brId,
        date: today,
        start_time: new Date(),
        end_time: null
      });
      return {
        employee_id: empId,
        branch_id: brId,
        date: today,
        start_time: attendance.start_time,
        end_time: null,
        total_hours: 0,
        message: 'Check-in recorded'
      };
    }

    return {
      employee_id: empId,
      branch_id: brId,
      date: today,
      start_time: attendance.start_time,
      end_time: attendance.end_time,
      total_hours: attendance.total_hours || 0,
      message: 'Check-in recorded (continuing same day)'
    };
  }

  static async checkOut(employeeId) {
    const today = new Date().toISOString().slice(0, 10);
    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;

    const attendance = await AttendanceModel.findOne({ employee_id: empId, date: today });

    if (!attendance) {
      throw new Error('No check-in found for today');
    }

    if (!attendance.start_time) {
      throw new Error('Invalid attendance: missing check-in');
    }

    attendance.end_time = new Date();

    const calculateHours = (start, end) => {
      if (!start || !end) return 0;
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
      const diff = (e - s) / (1000 * 60 * 60);
      return diff > 0 ? diff : 0;
    };

    attendance.total_hours = parseFloat(calculateHours(attendance.start_time, attendance.end_time).toFixed(2));
    await attendance.save();

    return {
      employee_id: empId,
      date: attendance.date,
      start_time: attendance.start_time,
      end_time: attendance.end_time,
      total_hours: attendance.total_hours
    };
  }

  static async getTodayAttendance(branchId) {
    const today = new Date().toISOString().slice(0, 10);
    return AttendanceModel.find({ branch_id: branchId, date: today })
      .populate('employee_id', 'name role')
      .sort({ start_time: -1 }).lean();
  }

  static async getSummary(branchId, startDate, endDate) {
    const records = await AttendanceModel.find({
      branch_id: branchId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0);
    const checkedOutCount = records.filter(r => r.end_time !== null).length;

    return {
      total_records: records.length,
      checked_out: checkedOutCount,
      pending_checkout: records.length - checkedOutCount,
      total_working_hours: parseFloat(totalHours.toFixed(2)),
      avg_working_hours: records.length > 0 ? parseFloat((totalHours / records.length).toFixed(2)) : 0
    };
  }
}

module.exports = Attendance;
