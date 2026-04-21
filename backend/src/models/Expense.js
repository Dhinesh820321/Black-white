const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', default: null },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_mode: { type: String, enum: ['CASH', 'UPI'], default: 'CASH', required: true },
  notes: { type: String, default: '' },
  receipt_image: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ExpenseModel = mongoose.model('Expense', expenseSchema);

class Expense {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) query.branch_id = filters.branch_id;
    if (filters.employee_id) query.employee_id = filters.employee_id;
    if (filters.category_id) query.category_id = filters.category_id;
    if (filters.payment_mode) query.payment_mode = filters.payment_mode;
    
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      query.created_at = { $gte: start, $lt: end };
    }

    if (filters.start_date && filters.end_date) {
      const start = new Date(filters.start_date);
      const end = new Date(filters.end_date);
      end.setDate(end.getDate() + 1);
      query.created_at = { $gte: start, $lt: end };
    }

    return ExpenseModel.find(query)
      .populate('branch_id', 'name')
      .populate('employee_id', 'name phone')
      .populate('category_id', 'name')
      .sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExpenseModel.findById(id)
      .populate('branch_id', 'name')
      .populate('employee_id', 'name phone')
      .populate('category_id', 'name')
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

    const cashExpenses = await ExpenseModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        payment_mode: 'CASH',
        created_at: { $gte: start, $lt: end } 
      }},
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const onlineExpenses = await ExpenseModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        payment_mode: 'ONLINE',
        created_at: { $gte: start, $lt: end } 
      }},
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const byCategory = await ExpenseModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end } 
      }},
      { $lookup: {
        from: 'expensecategories',
        localField: 'category_id',
        foreignField: '_id',
        as: 'category'
      }},
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: '$category_id',
        category_name: { $first: '$category.name' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }},
      { $project: { category_id: '$_id', category_name: 1, total: 1, count: 1, _id: 0 } }
    ]);

    return {
      cashExpenses: { total: cashExpenses[0]?.total || 0, count: cashExpenses[0]?.count || 0 },
      onlineExpenses: { total: onlineExpenses[0]?.total || 0, count: onlineExpenses[0]?.count || 0 },
      byCategory,
      total: (cashExpenses[0]?.total || 0) + (onlineExpenses[0]?.total || 0)
    };
  }

  static async countByCategory(categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return 0;
    return ExpenseModel.countDocuments({ category_id: categoryId });
  }
}

module.exports = Expense;
