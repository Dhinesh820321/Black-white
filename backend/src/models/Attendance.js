const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  branch_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: true 
  },
  date: { 
    type: String, 
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  check_in_time: { type: Date, default: null },
  check_out_time: { type: Date, default: null },
  working_minutes: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Not Checked In', 'In Progress', 'Completed'],
    default: 'Not Checked In'
  },
  location: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

attendanceSchema.methods.calculateStatus = function() {
  if (!this.check_in_time) {
    return 'Not Checked In';
  }
  if (this.check_in_time && !this.check_out_time) {
    return 'In Progress';
  }
  return 'Completed';
};

attendanceSchema.methods.calculateWorkingMinutes = function() {
  if (!this.check_in_time || !this.check_out_time) {
    return 0;
  }
  const diff = (this.check_out_time - this.check_in_time) / (1000 * 60);
  return Math.max(0, Math.floor(diff));
};

attendanceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  obj.status = this.calculateStatus();
  obj.working_minutes = this.calculateWorkingMinutes();
  delete obj.__v;
  return obj;
};

const AttendanceModel = mongoose.model('Attendance', attendanceSchema);

class Attendance {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) {
      query.branch_id = filters.branch_id;
    }
    if (filters.employee_id && mongoose.Types.ObjectId.isValid(filters.employee_id)) {
      query.employee_id = filters.employee_id;
    }
    if (filters.date) {
      query.date = filters.date;
    } else if (filters.start_date && filters.end_date) {
      query.date = { $gte: filters.start_date, $lte: filters.end_date };
    } else if (filters.filter) {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      switch (filters.filter) {
        case 'today':
          query.date = todayStr;
          break;
        case 'week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          query.date = { $gte: startOfWeek.toISOString().slice(0, 10) };
          break;
        case 'month':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          query.date = { $gte: startOfMonth.toISOString().slice(0, 10) };
          break;
        default:
          break;
      }
    }

    return AttendanceModel.find(query)
      .populate('employee_id', 'name role phone')
      .populate('branch_id', 'name')
      .sort({ date: -1, check_in_time: -1 })
      .lean();
  }

  static async checkIn(employeeId, branchId, location = null) {
    const today = new Date().toISOString().slice(0, 10);
    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    const brId = typeof branchId === 'string' ? new mongoose.Types.ObjectId(branchId) : branchId;

    let attendance = await AttendanceModel.findOne({ employee_id: empId, date: today });

    if (attendance) {
      if (attendance.check_in_time) {
        if (attendance.check_out_time) {
          throw new Error('Already checked out for today');
        }
        throw new Error('Already checked in');
      }
      
      attendance.check_in_time = new Date();
      attendance.status = 'In Progress';
      if (location) {
        attendance.location = location;
      }
      await attendance.save();
      return attendance;
    }

    const newAttendance = await AttendanceModel.create({
      employee_id: empId,
      branch_id: brId,
      date: today,
      check_in_time: new Date(),
      check_out_time: null,
      status: 'In Progress',
      working_minutes: 0,
      location: location
    });

    return newAttendance;
  }

  static async checkOut(employeeId) {
    const today = new Date().toISOString().slice(0, 10);
    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;

    const attendance = await AttendanceModel.findOne({ employee_id: empId, date: today });

    if (!attendance) {
      throw new Error('Check-in required first');
    }

    if (!attendance.check_in_time) {
      throw new Error('Invalid attendance: missing check-in');
    }

    if (attendance.check_out_time) {
      throw new Error('Already checked out');
    }

    attendance.check_out_time = new Date();
    attendance.status = 'Completed';
    attendance.working_minutes = attendance.calculateWorkingMinutes();
    await attendance.save();

    return attendance;
  }

  static async getTodayAttendance(branchId) {
    const today = new Date().toISOString().slice(0, 10);
    return AttendanceModel.find({ branch_id: branchId, date: today })
      .populate('employee_id', 'name role phone')
      .sort({ check_in_time: -1 })
      .lean();
  }

  static async getEmployeeToday(employeeId) {
    const today = new Date().toISOString().slice(0, 10);
    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    
    return AttendanceModel.findOne({ employee_id: empId, date: today }).lean();
  }

  static async getHistory(employeeId, filters = {}) {
    const empId = typeof employeeId === 'string' ? new mongoose.Types.ObjectId(employeeId) : employeeId;
    let query = { employee_id: empId };
    
    const today = new Date();
    
    switch (filters.filter) {
      case 'today':
        query.date = today.toISOString().slice(0, 10);
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        query.date = { $gte: startOfWeek.toISOString().slice(0, 10) };
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        query.date = { $gte: startOfMonth.toISOString().slice(0, 10) };
        break;
      default:
        break;
    }

    return AttendanceModel.find(query)
      .sort({ date: -1 })
      .lean();
  }

  static async getSummary(branchId, startDate, endDate) {
    const records = await AttendanceModel.find({
      branch_id: branchId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalMinutes = records.reduce((sum, r) => {
      return sum + (r.working_minutes || r.calculateWorkingMinutes() || 0);
    }, 0);
    
    const checkedOutCount = records.filter(r => r.check_out_time !== null).length;

    return {
      total_records: records.length,
      checked_out: checkedOutCount,
      pending_checkout: records.length - checkedOutCount,
      total_working_hours: parseFloat((totalMinutes / 60).toFixed(2)),
      avg_working_hours: records.length > 0 ? parseFloat((totalMinutes / records.length / 60).toFixed(2)) : 0
    };
  }
}

module.exports = Attendance;
