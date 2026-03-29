const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  gst_percentage: { type: Number, default: 18 },
  duration_minutes: { type: Number, default: 30 },
  commission_percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ServiceModel = mongoose.model('Service', serviceSchema);

class Service {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' };

    return ServiceModel.find(query).sort({ name: 1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ServiceModel.findById(id).lean();
  }

  static async create(data) {
    const service = new ServiceModel(data);
    await service.save();
    return service.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ServiceModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await ServiceModel.findByIdAndDelete(id);
    return true;
  }
}

module.exports = Service;
