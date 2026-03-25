const pool = require('../config/database');

class Customer {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (name LIKE ? OR phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.retention_alert) {
      query += ' AND DATEDIFF(CURDATE(), last_visit) > 45';
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, email, notes) VALUES (?, ?, ?, ?)',
      [data.name, data.phone, data.email || null, data.notes || null]
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
      await pool.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    return true;
  }

  static async getVisitHistory(customerId) {
    const [rows] = await pool.query(
      `SELECT i.*, e.name as employee_name, b.name as branch_name
       FROM invoices i
       JOIN employees e ON i.employee_id = e.id
       JOIN branches b ON i.branch_id = b.id
       WHERE i.customer_id = ?
       ORDER BY i.created_at DESC`,
      [customerId]
    );
    return rows;
  }

  static async getRetentionAlerts(branchId = null) {
    let query = `
      SELECT c.*, 
             DATEDIFF(CURDATE(), c.last_visit) as days_since_visit,
             b.name as last_branch
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, b.name, MAX(created_at) as last_visit_date
        FROM invoices i
        JOIN branches b ON i.branch_id = b.id
        GROUP BY customer_id, b.name
        ORDER BY last_visit_date DESC
      ) b ON c.id = b.customer_id
      WHERE c.last_visit IS NOT NULL AND DATEDIFF(CURDATE(), c.last_visit) > 45
    `;

    if (branchId) {
      query = `
        SELECT c.*, 
               DATEDIFF(CURDATE(), c.last_visit) as days_since_visit,
               b.name as last_branch
        FROM customers c
        JOIN invoices i ON c.id = i.customer_id
        JOIN branches b ON i.branch_id = b.id
        WHERE b.id = ? AND DATEDIFF(CURDATE(), c.last_visit) > 45
        GROUP BY c.id
      `;
      const [rows] = await pool.query(query, [branchId]);
      return rows;
    }

    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = Customer;
