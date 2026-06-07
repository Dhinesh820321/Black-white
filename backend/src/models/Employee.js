const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'stylist', 'helper'], required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  salary: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  device_id: { type: String },
  password_changed_at: { type: Date },
  // Geofencing fields (for employees who work at specific locations)
  geo_latitude: { type: Number },
  geo_longitude: { type: Number },
  geo_radius: { type: Number, default: 100 } // in meters
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const EmployeeModel = mongoose.model('Employee', employeeSchema);

class Employee {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) {
      query.branch_id = filters.branch_id;
    }
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }
    return EmployeeModel.find(query).populate('branch_id', 'name').sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return EmployeeModel.findById(id).populate('branch_id', 'name').lean();
  }

  static async findByPhone(phone) {
    return EmployeeModel.findOne({ phone }).populate('branch_id').lean();
  }

  static async create(data) {
    // Password should already be hashed before calling this method
    const employeeId = data.employee_id || uuidv4().slice(0, 8).toUpperCase();
    
    const employee = new EmployeeModel({
      ...data,
      employee_id: employeeId
    });
    
    const saved = await employee.save();
    return saved.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return EmployeeModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await EmployeeModel.findByIdAndDelete(id);
    return true;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getPerformance(employeeId, startDate, endDate, branchId = null) {
    const InvoiceModel = mongoose.model('Invoice');
    const AttendanceModel = mongoose.model('Attendance');

    // Build date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Handle both ObjectId and string employee IDs
    const empObjId = mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;

    // --- Invoice aggregation (services & revenue) ---
    const invoiceMatch = {
      employee_id: empObjId,
      created_at: { $gte: start, $lte: end },
      status: 'completed'
    };
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      invoiceMatch.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    const invoiceStats = await InvoiceModel.aggregate([
      { $match: invoiceMatch },
      { $group: {
        _id: null,
        revenue: { $sum: '$final_amount' },
        services: { $sum: 1 }
      }}
    ]);

    // --- Attendance aggregation (days worked & total hours) ---
    const startDateStr = start.toISOString().slice(0, 10);
    const endDateStr = end.toISOString().slice(0, 10);

    const attendanceStats = await AttendanceModel.aggregate([
      { $match: {
        employee_id: empObjId,
        date: { $gte: startDateStr, $lte: endDateStr },
        check_in_time: { $ne: null }
      }},
      { $group: {
        _id: null,
        days_worked: { $sum: 1 },
        total_minutes: { $sum: '$working_minutes' }
      }}
    ]);

    return {
      services: invoiceStats[0]?.services || 0,
      revenue: invoiceStats[0]?.revenue || 0,
      attendance: {
        days_worked: attendanceStats[0]?.days_worked || 0,
        total_hours: parseFloat(((attendanceStats[0]?.total_minutes || 0) / 60).toFixed(2))
      }
    };
  }
}

module.exports = Employee;
