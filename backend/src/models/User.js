const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  device_id: { type: String },
  password_changed_at: { type: Date },
  geo_lat: { type: Number },
  geo_long: { type: Number },
  geo_radius: { type: Number, default: 100 }
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
    if (filters.role) query.role = filters.role;
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
    return UserModel.findOne({ phone }).populate('branch_id').lean();
  }

  static async create(data) {
    if (data.password && !data.password.startsWith('$2')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const user = new UserModel(data);
    const saved = await user.save();
    return saved.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (data.password && !data.password.startsWith('$2')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
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
