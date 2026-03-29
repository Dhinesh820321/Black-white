const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  check_in_time: { type: Date },
  check_out_time: { type: Date },
  check_in_lat: { type: Number },
  check_in_lng: { type: Number },
  check_out_lat: { type: Number },
  check_out_lng: { type: Number },
  working_hours: { type: Number, default: 0 },
  status: { type: String, enum: ['checked_in', 'checked_out', 'active'], default: 'active' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const AttendanceModel = mongoose.model('Attendance', attendanceSchema);

class Attendance {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) query.branch_id = filters.branch_id;
    if (filters.employee_id && mongoose.Types.ObjectId.isValid(filters.employee_id)) query.employee_id = filters.employee_id;
    if (filters.status) query.status = filters.status;
    
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      query.check_in_time = { $gte: start, $lt: end };
    }

    return AttendanceModel.find(query)
      .populate('employee_id', 'name role')
      .populate('branch_id', 'name')
      .sort({ check_in_time: -1 }).lean();
  }

  static async checkIn(employeeId, branchId, lat, lng) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    const brId = typeof branchId === 'string' ? new mongoose.Types.ObjectId(branchId) : branchId;

    const existing = await AttendanceModel.findOne({
      employee_id: empId,
      check_in_time: { $gte: today, $lt: tomorrow },
      status: 'checked_in'
    });

    if (existing) {
      throw new Error('Already checked in today');
    }

    const attendance = new AttendanceModel({
      employee_id: empId,
      branch_id: brId,
      check_in_time: new Date(),
      check_in_lat: lat,
      check_in_lng: lng,
      status: 'checked_in'
    });

    await attendance.save();
    return { id: attendance._id, employee_id: empId, status: 'checked_in' };
  }

  static async checkOut(attendanceId, lat, lng) {
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) return null;
    
    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) throw new Error('Attendance record not found');

    const checkOutTime = new Date();
    const durationMs = checkOutTime - (attendance.check_in_time || checkOutTime);
    const workingHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

    attendance.check_out_time = checkOutTime;
    attendance.check_out_lat = lat;
    attendance.check_out_lng = lng;
    attendance.working_hours = parseFloat(workingHours);
    attendance.status = 'checked_out';

    await attendance.save();
    return this.findById(attendanceId);
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return AttendanceModel.findById(id)
      .populate('employee_id', 'name role')
      .populate('branch_id', 'name')
      .lean();
  }

  static async getTodayAttendance(branchId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return AttendanceModel.find({
      branch_id: branchId,
      check_in_time: { $gte: today, $lt: tomorrow }
    }).populate('employee_id', 'name role').sort({ check_in_time: -1 }).lean();
  }

  static async getSummary(branchId, startDate, endDate) {
    // Basic aggregation
    const records = await AttendanceModel.find({
      branch_id: branchId,
      check_in_time: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    const summary = {
      total_records: records.length,
      checked_in: records.filter(r => r.status === 'checked_in').length,
      checked_out: records.filter(r => r.status === 'checked_out').length,
      total_working_hours: records.reduce((sum, r) => sum + (r.working_hours || 0), 0)
    };
    summary.avg_working_hours = (summary.total_working_hours / records.length || 0).toFixed(2);

    return summary;
  }
}

module.exports = Attendance;
