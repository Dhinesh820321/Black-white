const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const invoiceItemSchema = new mongoose.Schema({
  service_id: { type: String, required: true },
  service_name: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  gst_percentage: { type: Number, default: 0 },
  subtotal: { type: Number }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoice_number: { type: String, unique: true },
  items: [invoiceItemSchema],
  total_amount: { type: Number, required: true },
  tax_amount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  payment_type: { type: String, enum: ['CASH', 'UPI', 'CARD'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  notes: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const InvoiceModel = mongoose.model('Invoice', invoiceSchema);

class Invoice {
  static async findAll(filters = {}) {
    let query = {};
    if (filters.branch_id && mongoose.Types.ObjectId.isValid(filters.branch_id)) query.branch_id = filters.branch_id;
    if (filters.customer_id && mongoose.Types.ObjectId.isValid(filters.customer_id)) query.customer_id = filters.customer_id;
    if (filters.employee_id && mongoose.Types.ObjectId.isValid(filters.employee_id)) query.employee_id = filters.employee_id;
    if (filters.payment_type) query.payment_type = filters.payment_type;
    
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      query.created_at = { $gte: start, $lt: end };
    }

    return InvoiceModel.find(query)
      .populate('employee_id', 'name')
      .populate('customer_id', 'name')
      .populate('branch_id', 'name')
      .sort({ created_at: -1 }).lean();
  }

  static async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return InvoiceModel.findById(id)
      .populate('employee_id', 'name')
      .populate('customer_id', 'name')
      .populate('branch_id', 'name')
      .populate('items.service_id', 'name')
      .lean();
  }

  static async create(data) {
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    
    try {
      const processedItems = (data.items || []).map(item => ({
        service_id: item.service_id?.toString(),
        service_name: item.service_name || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        subtotal: item.subtotal || ((item.price || 0) * (item.quantity || 1))
      }));

      const finalAmount = data.final_amount || data.total_amount || 0;

      const invoiceData = {
        ...data,
        items: processedItems,
        final_amount: finalAmount,
        invoice_number: invoiceNumber,
        branch_id: data.branch_id?.toString(),
        employee_id: data.employee_id?.toString(),
        customer_id: data.customer_id?.toString() || undefined
      };

      const invoice = new InvoiceModel(invoiceData);
      await invoice.save();

      const PaymentModel = mongoose.model('Payment');
      const payment = new PaymentModel({
        branch_id: invoice.branch_id,
        employee_id: invoice.employee_id,
        invoice_id: invoice._id,
        amount: finalAmount,
        payment_type: data.payment_type
      });
      await payment.save();

      return this.findById(invoice._id);
    } catch (error) {
      throw error;
    }
  }

  static async getDailyRevenue(branchId, date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const stats = await InvoiceModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end },
        status: 'completed'
      }},
      { $group: {
        _id: null,
        upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
        cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } },
        card: { $sum: { $cond: [{ $eq: ['$payment_type', 'CARD'] }, '$final_amount', 0] } },
        total: { $sum: '$final_amount' },
        count: { $sum: 1 }
      }}
    ]);

    return stats[0] || { upi: 0, cash: 0, card: 0, total: 0, count: 0 };
  }

  static async getMonthlyRevenue(branchId, year, month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    return InvoiceModel.aggregate([
      { $match: { 
        branch_id: new mongoose.Types.ObjectId(branchId), 
        created_at: { $gte: start, $lt: end },
        status: 'completed'
      }},
      { $group: {
        _id: { $dayOfMonth: '$created_at' },
        revenue: { $sum: '$final_amount' },
        invoices: { $sum: 1 }
      }},
      { $sort: { '_id': 1 } },
      { $project: { day: '$_id', revenue: 1, invoices: 1, _id: 0 } }
    ]);
  }
}

module.exports = Invoice;
