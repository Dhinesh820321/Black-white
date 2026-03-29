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

    const todayInvoices = await Invoice.findAll({ ...branchFilter, date: today });
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);
    
    // Month revenue aggregation (simplified using find for now)
    const monthInvoices = await Invoice.findAll({ 
      ...branchFilter, 
      start_date: firstDayOfMonth.toISOString(), 
      end_date: tomorrow.toISOString() 
    });
    const monthlyRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);

    const todayPayments = await Payment.findAll({ ...branchFilter, date: today });
    const collectionStats = todayPayments.reduce((stats, pay) => {
      stats.total += pay.amount || 0;
      if (pay.payment_type === 'UPI') stats.upi += pay.amount || 0;
      if (pay.payment_type === 'CASH') stats.cash += pay.amount || 0;
      return stats;
    }, { total: 0, upi: 0, cash: 0 });

    const attendanceRecords = await Attendance.getTodayAttendance(branch_id);
    
    const lowStock = await Inventory.getLowStockAlerts(branch_id);
    const retentionAlerts = await Customer.getRetentionAlerts(branch_id);
    
    // For large datasets, use countDocuments()
    const EmployeeModel = mongoose.model('Employee');
    const CustomerModel = mongoose.model('Customer');
    const totalCustomers = await CustomerModel.countDocuments();

    const dashboard = {
      today: {
        revenue: todayRevenue,
        collection: collectionStats.total,
        upiCollection: collectionStats.upi,
        cashCollection: collectionStats.cash,
        invoices: todayInvoices.length,
        attendance: {
          total: attendanceRecords.length,
          checkedIn: attendanceRecords.filter(a => a.status === 'checked_in').length
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
    const EmployeeModel = mongoose.model('Employee');
    const employees = await EmployeeModel.find({ status: 'active' }).limit(10).lean();
    return successResponse(res, employees.map(e => ({ ...e, services: 0, revenue: 0 })));
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getBranchComparison, getRevenueChart, getTopPerformers };
