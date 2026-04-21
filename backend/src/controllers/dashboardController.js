const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { successResponse } = require('../utils/responseHelper');

const getDashboard = async (req, res, next) => {
  try {
    const { branch_id } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const isValidBranch = branch_id && mongoose.Types.ObjectId.isValid(branch_id);
    const branchFilter = isValidBranch ? { branch_id: new mongoose.Types.ObjectId(branch_id) } : {};

    const todayInvoices = await Invoice.findAll({ ...branchFilter, date: today.toISOString() });
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);
    
    const monthInvoices = await Invoice.findAll({ 
      ...branchFilter, 
      start_date: firstDayOfMonth.toISOString(), 
      end_date: tomorrow.toISOString() 
    });
    const monthlyRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);

    const todayPayments = await Payment.findAll({ ...branchFilter, date: today.toISOString() });
    const collectionStats = todayPayments.reduce((stats, pay) => {
      stats.total += pay.amount || 0;
      if (pay.payment_type === 'UPI') stats.upi += pay.amount || 0;
      if (pay.payment_type === 'CASH') stats.cash += pay.amount || 0;
      return stats;
    }, { total: 0, upi: 0, cash: 0 });

    const attendanceRecords = await Attendance.getTodayAttendance(branch_id);
    
    const lowStock = await Inventory.getLowStockAlerts(branch_id);
    const retentionAlerts = await Customer.getRetentionAlerts(branch_id);
    
    const UserModel = mongoose.model('User');
    const CustomerModel = mongoose.model('Customer');
    let totalCustomers = await CustomerModel.countDocuments();
    if (isValidBranch) {
      totalCustomers = await CustomerModel.countDocuments({ branch_id: new mongoose.Types.ObjectId(branch_id) });
    }

    const dashboard = {
      today: {
        revenue: todayRevenue,
        collection: collectionStats.total,
        upiCollection: collectionStats.upi,
        cashCollection: collectionStats.cash,
        invoices: todayInvoices.length,
        attendance: {
          total: attendanceRecords.length,
          checkedIn: attendanceRecords.filter(a => a.check_out_time === null && a.check_in_time !== null).length
        }
      },
      month: {
        revenue: monthlyRevenue
      },
      totals: {
        lowStockItems: lowStock.length,
        retentionAlerts: retentionAlerts.length,
        totalCustomers: totalCustomers
      },
      alerts: {
        lowStock: lowStock.slice(0, 5),
        retention: retentionAlerts.slice(0, 5)
      }
    };

    return successResponse(res, dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    next(error);
  }
};

const getBranchComparison = async (req, res, next) => {
  try {
    const BranchModel = mongoose.model('Branch');
    const InvoiceModel = mongoose.model('Invoice');
    const branches = await BranchModel.find({ status: 'active' }).lean();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const branchData = await Promise.all(branches.map(async (branch) => {
      const stats = await InvoiceModel.aggregate([
        { $match: { 
          branch_id: branch._id, 
          created_at: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }},
        { $group: {
          _id: null,
          revenue: { $sum: '$final_amount' },
          invoices: { $sum: 1 }
        }}
      ]);
      return {
        ...branch,
        revenue: stats[0]?.revenue || 0,
        invoices: stats[0]?.invoices || 0
      };
    }));
    
    return successResponse(res, branchData);
  } catch (error) {
    next(error);
  }
};

const getRevenueTrend = async (req, res, next) => {
  try {
    const { branch_id, range = 'week' } = req.query;
    
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const matchFilter = {
      created_at: { $gte: startDate },
      status: 'completed'
    };

    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      matchFilter.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const data = await mongoose.model('Invoice').aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          revenue: { $sum: '$final_amount' },
          invoices: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, invoices: 1, _id: 0 } }
    ]);

    console.log('Revenue Trend - Branch:', branch_id, 'Days:', days, 'Data:', data.length);
    return successResponse(res, data);
  } catch (error) {
    console.error('Revenue trend error:', error);
    next(error);
  }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    if (!branch_id) {
      return getRevenueTrend(req, res, next);
    }
    const data = await Invoice.getMonthlyRevenue(branch_id, parseInt(year) || new Date().getFullYear(), parseInt(month) || new Date().getMonth() + 1);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

const getTopPerformers = async (req, res, next) => {
  try {
    const { branch_id } = req.query;
    const isValidBranch = branch_id && mongoose.Types.ObjectId.isValid(branch_id);
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const matchFilter = {
      created_at: { $gte: startOfMonth },
      status: 'completed'
    };

    if (isValidBranch) {
      matchFilter.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const performers = await mongoose.model('Invoice').aggregate([
      { $match: matchFilter },
      { $group: {
        _id: '$employee_id',
        revenue: { $sum: '$final_amount' },
        invoices: { $sum: 1 }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      { $project: {
        id: '$_id',
        name: '$employee.name',
        phone: '$employee.phone',
        revenue: 1,
        invoices: 1,
        _id: 0
      }}
    ]);

    return successResponse(res, performers);
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getDashboard, 
  getBranchComparison, 
  getRevenueChart,
  getRevenueTrend,
  getTopPerformers 
};
