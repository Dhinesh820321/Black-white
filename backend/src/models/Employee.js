const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Employee {
  static async findAll(filters = {}) {
    let query = `
      SELECT e.*, b.name as branch_name 
      FROM employees e 
      LEFT JOIN branches b ON e.branch_id = b.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.branch_id) {
      query += ' AND e.branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.role) {
      query += ' AND e.role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (e.name LIKE ? OR e.phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, b.name as branch_name 
       FROM employees e 
       LEFT JOIN branches b ON e.branch_id = b.id 
       WHERE e.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByPhone(phone) {
    const [rows] = await pool.query(
      `SELECT e.*, b.name as branch_name, b.geo_latitude, b.geo_longitude, b.geo_radius 
       FROM employees e 
       LEFT JOIN branches b ON e.branch_id = b.id 
       WHERE e.phone = ?`,
      [phone]
    );
    return rows[0];
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query(
      'INSERT INTO employees (name, role, phone, password, branch_id, salary, status, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.role, data.phone, hashedPassword, data.branch_id, data.salary || 0, data.status || 'active', data.device_id]
    );
    return { id: result.insertId, ...data, password: undefined };
  }

  static async update(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

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
      await pool.query(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    return true;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getPerformance(employeeId, startDate, endDate) {
    const [[services]] = await pool.query(
      `SELECT COUNT(*) as total_services, SUM(final_amount) as total_revenue 
       FROM invoices 
       WHERE employee_id = ? AND created_at BETWEEN ? AND ?`,
      [employeeId, startDate, endDate]
    );

    const [[attendance]] = await pool.query(
      `SELECT COUNT(*) as days_worked, SUM(working_hours) as total_hours 
       FROM attendance 
       WHERE employee_id = ? AND check_in_time BETWEEN ? AND ?`,
      [employeeId, startDate, endDate]
    );

    return { services: services.total_services, revenue: services.total_revenue, attendance };
  }
}

module.exports = Employee;
