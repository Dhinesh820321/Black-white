const pool = require('../config/database');

class Notification {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (filters.employee_id) {
      query += ' AND employee_id = ?';
      params.push(filters.employee_id);
    }

    if (filters.branch_id) {
      query += ' AND branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.unread) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO notifications (employee_id, branch_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [data.employee_id || null, data.branch_id || null, data.title, data.message, data.type || 'info']
    );
    return { id: result.insertId, ...data };
  }

  static async markAsRead(id) {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return true;
  }

  static async markAllAsRead(employeeId = null, branchId = null) {
    let query = 'UPDATE notifications SET is_read = TRUE WHERE 1=1';
    const params = [];

    if (employeeId) {
      query += ' AND employee_id = ?';
      params.push(employeeId);
    }

    if (branchId) {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }

    await pool.query(query, params);
    return true;
  }

  static async getUnreadCount(employeeId = null, branchId = null) {
    let query = 'SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE';
    const params = [];

    if (employeeId) {
      query += ' AND (employee_id = ? OR employee_id IS NULL)';
      params.push(employeeId);
    }

    if (branchId) {
      query += ' AND (branch_id = ? OR branch_id IS NULL)';
      params.push(branchId);
    }

    const [[result]] = await pool.query(query, params);
    return result.count;
  }
}

module.exports = Notification;
