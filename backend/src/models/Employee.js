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
  password_changed_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const EmployeeModel = mongoose.model('Employee', employeeSchema);

class Employee {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id) query.branch_id = filters.branch_id;
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
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const employeeId = data.employee_id || uuidv4().slice(0, 8).toUpperCase();
    
    const employee = new EmployeeModel({
      ...data,
      password: hashedPassword,
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

  static async getPerformance(employeeId, startDate, endDate) {
    // These require cross-collection aggregations.
    // For now we return empty stats.
    return {
      services: 0,
      revenue: 0,
      attendance: { days_worked: 0, total_hours: 0 }
    };
  }
}

module.exports = Employee;
