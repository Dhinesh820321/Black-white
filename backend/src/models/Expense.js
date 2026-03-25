const pool = require('../config/database');

class Expense {
  static async findAll(filters = {}) {
    let query = `
      SELECT e.*, b.name as branch_name, emp.name as created_by_name
      FROM expenses e 
      JOIN branches b ON e.branch_id = b.id 
      LEFT JOIN employees emp ON e.created_by = emp.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.branch_id) {
      query += ' AND e.branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.category) {
      query += ' AND e.category = ?';
      params.push(filters.category);
    }

    if (filters.date) {
      query += ' AND DATE(e.created_at) = ?';
      params.push(filters.date);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND DATE(e.created_at) BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    if (filters.month && filters.year) {
      query += ' AND MONTH(e.created_at) = ? AND YEAR(e.created_at) = ?';
      params.push(filters.month, filters.year);
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, b.name as branch_name, emp.name as created_by_name
       FROM expenses e 
       JOIN branches b ON e.branch_id = b.id 
       LEFT JOIN employees emp ON e.created_by = emp.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO expenses (branch_id, title, amount, category, receipt_image, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [data.branch_id, data.title, data.amount, data.category || 'misc', data.receipt_image, data.created_by]
    );
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    return true;
  }

  static async getSummary(branchId, startDate, endDate) {
    const [rows] = await pool.query(
      `SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
       FROM expenses 
       WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY category`,
      [branchId, startDate, endDate]
    );

    const [[total]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?',
      [branchId, startDate, endDate]
    );

    return { byCategory: rows, total: total.total };
  }
}

module.exports = Expense;
