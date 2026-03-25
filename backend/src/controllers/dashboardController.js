const pool = require('../config/database');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { successResponse } = require('../utils/responseHelper');

const getDashboard = async (req, res, next) => {
  try {
    const { branch_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    let branchFilter = branch_id ? `branch_id = ?` : '1=1';
    let branchFilterInvoices = branch_id ? `branch_id = ?` : '1=1';
    let branchFilterPayments = branch_id ? `branch_id = ?` : '1=1';

    const paramsBase = branch_id ? [branch_id] : [];
    const paramsRevenue = branch_id ? [today, branch_id] : [today];
    const paramsMonth = branch_id ? [firstDayOfMonth, today, branch_id] : [firstDayOfMonth, today];

    const [todayRevenue] = await pool.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total FROM invoices WHERE DATE(created_at) = ? AND ${branchFilterInvoices}`,
      paramsRevenue
    );

    const [monthRevenue] = await pool.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total FROM invoices WHERE DATE(created_at) BETWEEN ? AND ? AND ${branchFilterInvoices}`,
      paramsMonth
    );

    const [todayPayments] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_type = 'UPI' THEN amount ELSE 0 END), 0) as upi,
        COALESCE(SUM(CASE WHEN payment_type = 'CASH' THEN amount ELSE 0 END), 0) as cash,
        COALESCE(SUM(amount), 0) as total
       FROM payments WHERE DATE(created_at) = ? AND ${branchFilterPayments}`,
      paramsRevenue
    );

    const [attendance] = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END), 0) as checked_in
       FROM attendance WHERE DATE(check_in_time) = ? AND ${branchFilter}`,
      paramsRevenue
    );

    const [invoiceCount] = await pool.query(
      `SELECT COUNT(*) as count FROM invoices WHERE DATE(created_at) = ? AND ${branchFilterInvoices}`,
      paramsRevenue
    );

    let lowStock = [];
    let retentionAlerts = [];
    let customerCount = [{ count: 0 }];

    try {
      lowStock = await Inventory.getLowStockAlerts(branch_id);
    } catch (e) { console.warn('Low stock error:', e.message); }

    try {
      const [count] = await pool.query('SELECT COUNT(*) as count FROM customers');
      customerCount = count;
    } catch (e) { console.warn('Customer count error:', e.message); }

    try {
      retentionAlerts = await Customer.getRetentionAlerts(branch_id);
    } catch (e) { console.warn('Retention alerts error:', e.message); }

    const dashboard = {
      today: {
        revenue: todayRevenue[0]?.total || 0,
        collection: todayPayments[0]?.total || 0,
        upiCollection: todayPayments[0]?.upi || 0,
        cashCollection: todayPayments[0]?.cash || 0,
        invoices: invoiceCount[0]?.count || 0,
        attendance: {
          total: attendance[0]?.total || 0,
          checkedIn: attendance[0]?.checked_in || 0
        }
      },
      month: {
        revenue: monthRevenue[0]?.total || 0
      },
      totals: {
        lowStockItems: lowStock.length,
        retentionAlerts: retentionAlerts.length,
        totalCustomers: customerCount[0]?.count || 0
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
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const [branches] = await pool.query(`
      SELECT 
        b.id,
        b.name,
        COALESCE(SUM(i.final_amount), 0) as revenue,
        COUNT(DISTINCT i.id) as invoices,
        COUNT(DISTINCT a.id) as attendance_records,
        COALESCE(SUM(a.working_hours), 0) as total_hours
      FROM branches b
      LEFT JOIN invoices i ON b.id = i.branch_id AND DATE(i.created_at) BETWEEN ? AND ?
      LEFT JOIN attendance a ON b.id = a.branch_id AND DATE(a.check_in_time) BETWEEN ? AND ?
      WHERE b.status = 'active'
      GROUP BY b.id
      ORDER BY revenue DESC
    `, [startDate, endDate, startDate, endDate]);

    return successResponse(res, branches);
  } catch (error) {
    next(error);
  }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const [dailyRevenue] = await pool.query(`
      SELECT 
        DAY(created_at) as day,
        SUM(final_amount) as revenue,
        COUNT(*) as invoices
      FROM invoices
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ? AND status = 'completed'
      ${branch_id ? 'AND branch_id = ?' : ''}
      GROUP BY DAY(created_at)
      ORDER BY day
    `, branch_id ? [targetYear, targetMonth, branch_id] : [targetYear, targetMonth]);

    return successResponse(res, dailyRevenue);
  } catch (error) {
    next(error);
  }
};

const getTopPerformers = async (req, res, next) => {
  try {
    const { branch_id, limit = 10 } = req.query;
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const [employees] = await pool.query(`
      SELECT 
        e.id,
        e.name,
        e.role,
        b.name as branch_name,
        COUNT(i.id) as services,
        COALESCE(SUM(i.final_amount), 0) as revenue
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN invoices i ON e.id = i.employee_id AND DATE(i.created_at) BETWEEN ? AND ?
      ${branch_id ? 'AND i.branch_id = ?' : ''}
      WHERE e.status = 'active'
      GROUP BY e.id
      ORDER BY revenue DESC
      LIMIT ?
    `, branch_id ? [firstDayOfMonth, today, branch_id, parseInt(limit)] : [firstDayOfMonth, today, parseInt(limit)]);

    return successResponse(res, employees);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getBranchComparison, getRevenueChart, getTopPerformers };
