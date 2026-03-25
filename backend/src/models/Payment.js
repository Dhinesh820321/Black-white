const pool = require('../config/database');

class Payment {
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, e.name as employee_name, b.name as branch_name, i.invoice_number
      FROM payments p 
      JOIN employees e ON p.employee_id = e.id 
      JOIN branches b ON p.branch_id = b.id 
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.branch_id) {
      query += ' AND p.branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.employee_id) {
      query += ' AND p.employee_id = ?';
      params.push(filters.employee_id);
    }

    if (filters.payment_type) {
      query += ' AND p.payment_type = ?';
      params.push(filters.payment_type);
    }

    if (filters.date) {
      query += ' AND DATE(p.created_at) = ?';
      params.push(filters.date);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND DATE(p.created_at) BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    if (filters.month && filters.year) {
      query += ' AND MONTH(p.created_at) = ? AND YEAR(p.created_at) = ?';
      params.push(filters.month, filters.year);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO payments (branch_id, employee_id, invoice_id, amount, payment_type, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [data.branch_id, data.employee_id, data.invoice_id || null, data.amount, data.payment_type, data.notes || null]
    );
    return { id: result.insertId, ...data };
  }

  static async getDailyTotals(branchId, date) {
    const [rows] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_type = 'UPI' THEN amount ELSE 0 END), 0) as upi_total,
        COALESCE(SUM(CASE WHEN payment_type = 'CASH' THEN amount ELSE 0 END), 0) as cash_total,
        COALESCE(SUM(CASE WHEN payment_type = 'CARD' THEN amount ELSE 0 END), 0) as card_total,
        COALESCE(SUM(amount), 0) as total
       FROM payments 
       WHERE branch_id = ? AND DATE(created_at) = ?`,
      [branchId, date]
    );
    return rows[0];
  }

  static async getAnalytics(branchId, startDate, endDate) {
    const [daily] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        payment_type,
        SUM(amount) as amount,
        COUNT(*) as count
       FROM payments 
       WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY DATE(created_at), payment_type
       ORDER BY date DESC`,
      [branchId, startDate, endDate]
    );

    const [summary] = await pool.query(
      `SELECT 
        payment_type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount
       FROM payments 
       WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY payment_type`,
      [branchId, startDate, endDate]
    );

    return { daily, summary };
  }
}

module.exports = Payment;
