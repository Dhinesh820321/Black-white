const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  email: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  last_visit: { type: Date },
  visit_count: { type: Number, default: 0 },
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
      query.last_visit = { $lt: fortyFiveDaysAgo, $ne: null };
    }
    
    if (filters.branchId && mongoose.Types.ObjectId.isValid(filters.branchId)) {
      query.branchId = filters.branchId;
    }
    
    const customers = await CustomerModel.find(query)
      .populate('branchId', 'name')
      .sort({ created_at: -1 })
      .lean();
    
    return customers.map(c => ({
      ...c,
      branch_name: c.branchId?.name || null,
      branch_id: c.branchId?._id || null,
      days_since_visit: c.last_visit ? Math.floor((new Date() - c.last_visit) / (1000 * 60 * 60 * 24)) : null
    }));
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

  static async recordVisit(id, invoiceAmount) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    
    const loyaltyPoints = Math.floor(invoiceAmount / 100);
    
    return CustomerModel.findByIdAndUpdate(
      id,
      {
        $inc: { visit_count: 1 },
        $set: { last_visit: new Date() },
        $inc: { loyalty_points: loyaltyPoints }
      },
      { new: true }
    ).lean();
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
    
    let query = { last_visit: { $lt: fortyFiveDaysAgo, $ne: null } };
    
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      query.branchId = branchId;
    }
    
    const customers = await CustomerModel.find(query)
      .populate('branchId', 'name')
      .lean();
    
    return customers.map(c => ({
      ...c,
      branch_name: c.branchId?.name || null,
      branch_id: c.branchId?._id || null,
      days_since_visit: c.last_visit ? Math.floor((new Date() - c.last_visit) / (1000 * 60 * 60 * 24)) : null
    }));
  }
}

module.exports = Customer;
