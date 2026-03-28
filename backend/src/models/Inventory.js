const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  item_name: { type: String, required: true },
  category: { type: String },
  total_quantity: { type: Number, default: 0 },
  used_quantity: { type: Number, default: 0 },
  remaining_quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'pcs' },
  min_stock_level: { type: Number, default: 10 },
  cost_per_unit: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const usageSchema = new mongoose.Schema({
  inventory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  quantity_used: { type: Number, required: true },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  created_at: { type: Date, default: Date.now }
});

const InventoryModel = mongoose.model('Inventory', inventorySchema);
const UsageModel = mongoose.model('InventoryUsage', usageSchema);

class Inventory {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id) query.branch_id = filters.branch_id;
    if (filters.category) query.category = filters.category;
    if (filters.low_stock) query.$expr = { $lte: ['$remaining_quantity', '$min_stock_level'] };
    if (filters.search) query.item_name = { $regex: filters.search, $options: 'i' };

    return InventoryModel.find(query).populate('branch_id', 'name').sort({ item_name: 1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return InventoryModel.findById(id).populate('branch_id', 'name').lean();
  }

  static async create(data) {
    const remaining = data.total_quantity - (data.used_quantity || 0);
    const item = new InventoryModel({ ...data, remaining_quantity: remaining });
    await item.save();
    return item.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (data.total_quantity !== undefined) {
      const current = await InventoryModel.findById(id);
      data.remaining_quantity = data.total_quantity - (current.used_quantity || 0);
    }
    return InventoryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async useInventory(inventoryId, quantity, employeeId, serviceId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const item = await InventoryModel.findById(inventoryId).session(session);
      if (!item || item.remaining_quantity < quantity) {
        throw new Error('Insufficient inventory or item not found');
      }

      item.used_quantity += quantity;
      item.remaining_quantity -= quantity;
      await item.save();

      const usage = new UsageModel({
        inventory_id: inventoryId,
        employee_id: employeeId,
        quantity_used: quantity,
        service_id: serviceId
      });
      await usage.save({ session });

      await session.commitTransaction();
      return item.toObject();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await InventoryModel.findByIdAndDelete(id);
    return true;
  }

  static async getLowStockAlerts(branchId = null) {
    let query = { $expr: { $lte: ['$remaining_quantity', '$min_stock_level'] } };
    if (branchId) query.branch_id = branchId;
    return InventoryModel.find(query).populate('branch_id', 'name').lean();
  }

  static async getUsageReport(branchId, startDate, endDate) {
    // Basic implementation using find and manual grouping
    const usages = await UsageModel.find({
      created_at: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('inventory_id');
    
    const filtered = usages.filter(u => u.inventory_id && u.inventory_id.branch_id.toString() === branchId);
    // Grouping logic omitted for brevity, returns usages for now
    return filtered;
  }
}

module.exports = Inventory;
