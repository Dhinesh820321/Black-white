const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  geo_latitude: { type: Number },
  geo_longitude: { type: Number },
  geo_radius: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const BranchModel = mongoose.model('Branch', branchSchema);

class Branch {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } }
      ];
    }
    return BranchModel.find(query).sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BranchModel.findById(id).lean();
  }

  static async create(data) {
    const branch = new BranchModel(data);
    const saved = await branch.save();
    return saved.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BranchModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await BranchModel.findByIdAndDelete(id);
    return true;
  }

  static async getWithStats(branchId) {
    const branch = await this.findById(branchId);
    if (!branch) return null;
    
    // Stats will need to be aggregated from other models (Attendance, Invoice)
    // For now, we return 0 stats.
    return {
      ...branch,
      todayAttendance: 0,
      todayRevenue: 0
    };
  }
}

module.exports = Branch;
