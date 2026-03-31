const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  email: { type: String },
  last_visit: { type: Date },
  loyalty_points: { type: Number, default: 0 },
  notes: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const CustomerModel = mongoose.model('Customer', customerSchema);

class Customer {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.retention_alert) {
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
      query.last_visit = { $lt: fortyFiveDaysAgo };
    }
    return CustomerModel.find(query).sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return CustomerModel.findById(id).lean();
  }

  static async findByPhone(phone) {
    if (!phone) return null;
    return CustomerModel.findOne({ phone: phone.trim() }).lean();
  }

  static async create(data) {
    const customer = new CustomerModel(data);
    await customer.save();
    return customer.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return CustomerModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await CustomerModel.findByIdAndDelete(id);
    return true;
  }

  static async getVisitHistory(customerId) {
    // Requires Invoice model
    return [];
  }

  static async getRetentionAlerts(branchId = null) {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    
    let query = { last_visit: { $lt: fortyFiveDaysAgo } };
    
    // In MongoDB, we'd typically use aggregation for complex joins,
    // but here we'll keep it simple for the MVP.
    const customers = await CustomerModel.find(query).lean();
    return customers.map(c => ({
      ...c,
      days_since_visit: Math.floor((new Date() - c.last_visit) / (1000 * 60 * 60 * 24))
    }));
  }
}

module.exports = Customer;
