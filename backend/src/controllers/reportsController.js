const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');
const { successResponse } = require('../utils/responseHelper');

const getDailyReport = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // 1. Revenue & Invoice Stats
    const revenue = await Invoice.getDailyRevenue(branch_id, targetDate);

    // 2. Attendance Records
    const attendance = await Attendance.findAll({ branch_id, date: targetDate });

    // 3. Expenses
    const expenseData = await Expense.getSummary(branch_id, targetDate, targetDate);

    // 4. Detailed Invoices
    const invoices = await Invoice.findAll({ branch_id, date: targetDate });

    return successResponse(res, {
      date: targetDate,
      revenue,
      invoices,
      attendance,
      expenses: expenseData.total,
      summary: {
        totalRevenue: revenue.total,
        totalExpenses: expenseData.total,
        netProfit: revenue.total - expenseData.total
      }
    });
  } catch (error) {
    console.error('Daily Report Error:', error);
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // 1. Daily Data for Chart
    const dailyData = await Invoice.getMonthlyRevenue(branch_id, targetYear, targetMonth);

    // 2. Summary Stats (Aggregation)
    const InvoiceModel = mongoose.model('Invoice');
    const summaryStats = await InvoiceModel.aggregate([
      { $match: { 
          branch_id: new mongoose.Types.ObjectId(branch_id),
          created_at: { $gte: startDate, $lte: endDate },
          status: 'completed'
      }},
      { $group: {
          _id: null,
          revenue: { $sum: '$final_amount' },
          subtotal: { $sum: '$total_amount' },
          tax: { $sum: '$tax_amount' },
          discount: { $sum: '$discount' },
          total_invoices: { $sum: 1 },
          avg_invoice_value: { $avg: '$final_amount' },
          upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
          cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } }
      }}
    ]);

    const summary = summaryStats[0] || { revenue: 0, total_invoices: 0, avg_invoice_value: 0, upi: 0, cash: 0 };

    // 3. Expenses
    const expenseSummary = await Expense.getSummary(branch_id, startDate, endDate);

    // 4. Attendance
    const attendanceSummary = await Attendance.getSummary(branch_id, startDate, endDate);

    return successResponse(res, {
      period: { year: targetYear, month: targetMonth, startDate, endDate },
      summary,
      expenses: expenseSummary.byCategory || [],
      attendance: attendanceSummary,
      dailyData,
      profit: summary.revenue - expenseSummary.total
    });
  } catch (error) {
    console.error('Monthly Report Error:', error);
    next(error);
  }
};

const getBranchPerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const BranchModel = mongoose.model('Branch');
    const branches = await BranchModel.find({ status: 'active' }).lean();

    // Mapping over branches to get stats for each (simplified for MVP)
    const performanceData = await Promise.all(branches.map(async (branch) => {
      const revenue = await Invoice.getDailyRevenue(branch._id, start_date); // Note: Simplified for period
      const expenses = await Expense.getSummary(branch._id, start_date, end_date);
      
      return {
        id: branch._id,
        name: branch.name,
        location: branch.location,
        revenue: revenue.total,
        invoices: revenue.count,
        expenses: expenses.total,
        profit: revenue.total - expenses.total,
        profitMargin: revenue.total > 0 ? ((revenue.total - expenses.total) / revenue.total * 100).toFixed(2) : 0
      };
    }));

    return successResponse(res, {
      period: { start_date, end_date },
      branches: performanceData
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeePerformanceReport = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const EmployeeModel = mongoose.model('Employee');
    const filter = { status: 'active' };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) filter.branch_id = branch_id;

    const employees = await EmployeeModel.find(filter).populate('branch_id', 'name').lean();

    const performanceData = await Promise.all(employees.map(async (emp) => {
      // In a real app, use complex aggregations. For now, we return empty stats.
      return {
        id: emp._id,
        name: emp.name,
        role: emp.role,
        branch_name: emp.branch_id?.name || 'N/A',
        services: 0,
        revenue: 0,
        days_worked: 0,
        total_hours: 0,
        avg_hours_per_day: 0,
        avgRevenuePerService: 0
      };
    }));

    return successResponse(res, {
      period: { start_date, end_date },
      employees: performanceData
    });
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    // Basic success response for now
    return successResponse(res, { message: 'Export logic ready' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDailyReport, getMonthlyReport, getBranchPerformanceReport, getEmployeePerformanceReport, exportReport };
