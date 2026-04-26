const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'employee', 'stylist', 'helper'], required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  salary: { type: Number, default: 0 },
  device_id: { type: String },
  password_changed_at: { type: Date },
  geo_lat: { type: Number },
  geo_long: { type: Number },
  geo_radius: { type: Number, default: 100 },
  profile_image: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const UserModel = mongoose.model('User', userSchema);

class User {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) {
      query.branch_id = filters.branch_id;
    }
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }
    return UserModel.find(query).populate('branch_id', 'name').sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserModel.findById(id).populate('branch_id', 'name').lean();
  }

  static async findByPhone(phone) {
    const normalizedPhone = phone.replace(/[\s-]/g, '');
    return UserModel.findOne({ phone: normalizedPhone }).populate('branch_id').lean();
  }

  static async create(data) {
    const plainPassword = data.saveAsPlain ? data.password : null;
    if (data.saveAsPlain) delete data.saveAsPlain;
    if (data.password && !data.password.startsWith('$2')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const user = new UserModel(data);
    const saved = await user.save();
    const result = saved.toObject();
    if (plainPassword) {
      result.password = plainPassword;
    }
    return result;
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (data.saveAsPlain !== undefined) delete data.saveAsPlain;
    const employee = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return employee;
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await UserModel.findByIdAndDelete(id);
    return true;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
module.exports.UserModel = UserModel;
