const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ExpenseCategoryModel = mongoose.model('ExpenseCategory', expenseCategorySchema);

class ExpenseCategory {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }
    return ExpenseCategoryModel.find(query).sort({ created_at: -1 }).lean();
  }

  static async findActive() {
    return ExpenseCategoryModel.find({ status: 'active' }).sort({ name: 1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExpenseCategoryModel.findById(id).lean();
  }

  static async create(data) {
    const category = new ExpenseCategoryModel(data);
    await category.save();
    return category.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExpenseCategoryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await ExpenseCategoryModel.findByIdAndDelete(id);
    return true;
  }

  static async isInUse(id) {
    const Expense = require('./Expense');
    const count = await Expense.countByCategory(id);
    return count > 0;
  }
}

module.exports = ExpenseCategory;
module.exports.ExpenseCategoryModel = ExpenseCategoryModel;
