const pool = require('../config/database');
const { successResponse } = require('../utils/responseHelper');

const getDailyReport = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let branchFilter = branch_id ? `AND i.branch_id = ${branch_id}` : '';

    const [invoices] = await pool.query(`
      SELECT i.*, e.name as employee_name, c.name as customer_name
      FROM invoices i
      JOIN employees e ON i.employee_id = e.id
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE DATE(i.created_at) = ? ${branchFilter}
      ORDER BY i.created_at DESC
    `, [targetDate]);

    const [[revenue]] = await pool.query(`
      SELECT 
        SUM(total_amount) as subtotal,
        SUM(tax_amount) as tax,
        SUM(discount) as discount,
        SUM(final_amount) as total,
        COUNT(*) as invoice_count,
        SUM(CASE WHEN payment_type = 'UPI' THEN final_amount ELSE 0 END) as upi,
        SUM(CASE WHEN payment_type = 'CASH' THEN final_amount ELSE 0 END) as cash
      FROM invoices
      WHERE DATE(created_at) = ? ${branchFilter}
    `, [targetDate]);

    const [attendance] = await pool.query(`
      SELECT a.*, e.name, e.role
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE DATE(a.check_in_time) = ? ${branch_id ? 'AND a.branch_id = ' + branch_id : ''}
      ORDER BY a.check_in_time
    `, [targetDate]);

    const [[expenses]] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses
      WHERE DATE(created_at) = ? ${branch_id ? 'AND branch_id = ' + branch_id : ''}
    `, [targetDate]);

    return successResponse(res, {
      date: targetDate,
      revenue,
      invoices,
      attendance,
      expenses: expenses.total,
      summary: {
        netProfit: revenue.total - expenses.total
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    let branchFilter = branch_id ? `AND branch_id = ${branch_id}` : '';

    const [dailyData] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(final_amount) as revenue,
        COUNT(*) as invoices
      FROM invoices
      WHERE DATE(created_at) BETWEEN ? AND ? ${branchFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);

    const [[summary]] = await pool.query(`
      SELECT 
        SUM(total_amount) as subtotal,
        SUM(tax_amount) as tax,
        SUM(discount) as discount,
        SUM(final_amount) as revenue,
        COUNT(*) as total_invoices,
        AVG(final_amount) as avg_invoice_value,
        SUM(CASE WHEN payment_type = 'UPI' THEN final_amount ELSE 0 END) as upi,
        SUM(CASE WHEN payment_type = 'CASH' THEN final_amount ELSE 0 END) as cash
      FROM invoices
      WHERE DATE(created_at) BETWEEN ? AND ? ${branchFilter}
    `, [startDate, endDate]);

    const [[expenses]] = await pool.query(`
      SELECT 
        SUM(amount) as total,
        category,
        COUNT(*) as count
      FROM expenses
      WHERE DATE(created_at) BETWEEN ? AND ? ${branchFilter}
      GROUP BY category
    `, [startDate, endDate]);

    const [[attendance]] = await pool.query(`
      SELECT 
        COUNT(*) as total_days,
        SUM(working_hours) as total_hours,
        AVG(working_hours) as avg_hours
      FROM attendance
      WHERE DATE(check_in_time) BETWEEN ? AND ? ${branch_id ? 'AND branch_id = ' + branch_id : ''}
    `, [startDate, endDate]);

    return successResponse(res, {
      period: { year: targetYear, month: targetMonth, startDate, endDate },
      summary,
      expenses: expenses || [],
      attendance,
      dailyData,
      profit: summary.revenue - (expenses?.total || 0)
    });
  } catch (error) {
    next(error);
  }
};

const getBranchPerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const [branches] = await pool.query(`
      SELECT 
        b.id,
        b.name,
        b.location,
        COALESCE(rev.total_revenue, 0) as revenue,
        COALESCE(rev.invoice_count, 0) as invoices,
        COALESCE(att.employees, 0) as attendance_count,
        COALESCE(att.avg_hours, 0) as avg_hours,
        COALESCE(exp.total_expenses, 0) as expenses
      FROM branches b
      LEFT JOIN (
        SELECT branch_id, SUM(final_amount) as total_revenue, COUNT(*) as invoice_count
        FROM invoices
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY branch_id
      ) rev ON b.id = rev.branch_id
      LEFT JOIN (
        SELECT branch_id, COUNT(*) as employees, AVG(working_hours) as avg_hours
        FROM attendance
        WHERE DATE(check_in_time) BETWEEN ? AND ?
        GROUP BY branch_id
      ) att ON b.id = att.branch_id
      LEFT JOIN (
        SELECT branch_id, SUM(amount) as total_expenses
        FROM expenses
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY branch_id
      ) exp ON b.id = exp.branch_id
      WHERE b.status = 'active'
      ORDER BY revenue DESC
    `, [startDate, endDate, startDate, endDate, startDate, endDate]);

    return successResponse(res, {
      period: { startDate, endDate },
      branches: branches.map(b => ({
        ...b,
        profit: b.revenue - b.expenses,
        profitMargin: b.revenue > 0 ? ((b.revenue - b.expenses) / b.revenue * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeePerformanceReport = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];
    let branchFilter = branch_id ? `AND i.branch_id = ${branch_id}` : '';

    const [employees] = await pool.query(`
      SELECT 
        e.id,
        e.name,
        e.role,
        b.name as branch_name,
        COUNT(DISTINCT i.id) as services,
        COALESCE(SUM(i.final_amount), 0) as revenue,
        COUNT(DISTINCT DATE(a.check_in_time)) as days_worked,
        COALESCE(SUM(a.working_hours), 0) as total_hours,
        COALESCE(AVG(a.working_hours), 0) as avg_hours_per_day
      FROM employees e
      JOIN branches b ON e.branch_id = b.id
      LEFT JOIN invoices i ON e.id = i.employee_id AND DATE(i.created_at) BETWEEN ? AND ? ${branchFilter}
      LEFT JOIN attendance a ON e.id = a.employee_id AND DATE(a.check_in_time) BETWEEN ? AND ?
      WHERE e.status = 'active' ${branch_id ? 'AND e.branch_id = ' + branch_id : ''}
      GROUP BY e.id
      ORDER BY revenue DESC
    `, [startDate, endDate, startDate, endDate]);

    return successResponse(res, {
      period: { startDate, endDate },
      employees: employees.map(e => ({
        ...e,
        avgRevenuePerService: e.services > 0 ? (e.revenue / e.services).toFixed(2) : 0
      }))
    });
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { type, format } = req.query;
    const report = type === 'daily' ? await getDailyReportData(req) :
                   type === 'monthly' ? await getMonthlyReportData(req) : {};

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      return res.send(convertToCSV(report));
    }

    return successResponse(res, report);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDailyReport, getMonthlyReport, getBranchPerformanceReport, getEmployeePerformanceReport, exportReport };
