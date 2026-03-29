const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  payment_type: { type: String, enum: ['CASH', 'UPI', 'CARD'], required: true },
  notes: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const PaymentModel = mongoose.model('Payment', paymentSchema);

class Payment {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) query.branch_id = filters.branch_id;
    if (filters.employee_id && mongoose.Types.ObjectId.isValid(filters.employee_id)) query.employee_id = filters.employee_id;
    if (filters.payment_type) query.payment_type = filters.payment_type;
    
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      query.created_at = { $gte: start, $lt: end };
    }

    return PaymentModel.find(query)
      .populate('employee_id', 'name')
      .populate('branch_id', 'name')
      .populate('invoice_id', 'invoice_number')
      .sort({ created_at: -1 }).lean();
  }

  static async create(data) {
    const payment = new PaymentModel(data);
    await payment.save();
    return payment.toObject();
  }

  static async getDailyTotals(branchId, date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const stats = await PaymentModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end } 
      }},
      { $group: {
        _id: null,
        upi_total: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$amount', 0] } },
        cash_total: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$amount', 0] } },
        card_total: { $sum: { $cond: [{ $eq: ['$payment_type', 'CARD'] }, '$amount', 0] } },
        total: { $sum: '$amount' }
      }}
    ]);

    return stats[0] || { upi_total: 0, cash_total: 0, card_total: 0, total: 0 };
  }

  static async getAnalytics(branchId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    const summary = await PaymentModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end } 
      }},
      { $group: {
        _id: '$payment_type',
        total_amount: { $sum: '$amount' },
        transaction_count: { $sum: 1 },
        avg_amount: { $avg: '$amount' }
      }},
      { $project: { payment_type: '$_id', total_amount: 1, transaction_count: 1, avg_amount: 1, _id: 0 } }
    ]);

    return { daily: [], summary };
  }
}

module.exports = Payment;
