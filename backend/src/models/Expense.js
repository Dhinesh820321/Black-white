const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'misc' },
  receipt_image: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ExpenseModel = mongoose.model('Expense', expenseSchema);

class Expense {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) query.branch_id = filters.branch_id;
    if (filters.category) query.category = filters.category;
    
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      query.created_at = { $gte: start, $lt: end };
    }

    return ExpenseModel.find(query)
      .populate('branch_id', 'name')
      .populate('created_by', 'name')
      .sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExpenseModel.findById(id)
      .populate('branch_id', 'name')
      .populate('created_by', 'name')
      .lean();
  }

  static async create(data) {
    const expense = new ExpenseModel(data);
    await expense.save();
    return expense.toObject();
  }

  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExpenseModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await ExpenseModel.findByIdAndDelete(id);
    return true;
  }

  static async getSummary(branchId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    const byCategory = await ExpenseModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end } 
      }},
      { $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }},
      { $project: { category: '$_id', total: 1, count: 1, _id: 0 } }
    ]);

    const totalStats = await ExpenseModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end } 
      }},
      { $group: {
        _id: null,
        total: { $sum: '$amount' }
      }}
    ]);

    return { byCategory, total: totalStats[0]?.total || 0 };
  }
}

module.exports = Expense;
