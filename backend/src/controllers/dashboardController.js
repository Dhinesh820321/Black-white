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

    const todayMatch = { created_at: { $gte: today, $lt: tomorrow }, status: 'completed' };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      todayMatch.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const monthMatch = { created_at: { $gte: firstDayOfMonth, $lt: tomorrow }, status: 'completed' };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      monthMatch.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const todayData = await InvoiceModel.aggregate([
      { $match: todayMatch },
      { $group: {
        _id: null,
        total: { $sum: '$final_amount' },
        upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
        cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } },
        count: { $sum: 1 }
      }}
    ]);

    const monthData = await InvoiceModel.aggregate([
      { $match: monthMatch },
      { $group: {
        _id: null,
        total: { $sum: '$final_amount' }
      }}
    ]);

    const attendanceRecords = await Attendance.getTodayAttendance(branch_id);
    const lowStock = await Inventory.getLowStockAlerts(branch_id);
    const retentionAlerts = await Customer.getRetentionAlerts(branch_id);
    
    const CustomerModel = mongoose.model('Customer');
    const totalCustomers = await CustomerModel.countDocuments();

    const dashboard = {
      today: {
        revenue: todayData[0]?.total || 0,
        collection: todayData[0]?.total || 0,
        upiCollection: todayData[0]?.upi || 0,
        cashCollection: todayData[0]?.cash || 0,
        invoices: todayData[0]?.count || 0,
        attendance: {
          total: attendanceRecords.length,
          checkedIn: attendanceRecords.filter(a => a.status === 'checked_in').length
        }
      },
      month: {
        revenue: monthData[0]?.total || 0
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
    const branches = await BranchModel.find({ status: 'active' }).lean();
    
    // In a real app, use aggregation. For MVP, we'll return the list.
    return successResponse(res, branches.map(b => ({ ...b, revenue: 0, invoices: 0 })));
  } catch (error) {
    next(error);
  }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    if (!branch_id) return successResponse(res, []);
    const data = await Invoice.getMonthlyRevenue(branch_id, parseInt(year) || new Date().getFullYear(), parseInt(month) || new Date().getMonth() + 1);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

const getTopPerformers = async (req, res, next) => {
  try {
    const UserModel = mongoose.model('User');
    const employees = await UserModel.find({ role: 'employee', status: 'active' }).limit(10).lean();
    return successResponse(res, employees.map(e => ({ ...e, password: undefined, services: 0, revenue: 0 })));
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getBranchComparison, getRevenueChart, getTopPerformers };
