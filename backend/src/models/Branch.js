const pool = require('../config/database');

class Branch {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM branches WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR location LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM branches WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO branches (name, location, geo_latitude, geo_longitude, geo_radius, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.location, data.geo_latitude, data.geo_longitude, data.geo_radius || 100, data.status || 'active']
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
      await pool.query(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM branches WHERE id = ?', [id]);
    return true;
  }

  static async getWithStats(branchId) {
    const branch = await this.findById(branchId);
    if (!branch) return null;

    const today = new Date().toISOString().split('T')[0];

    const [[attendance]] = await pool.query(
      'SELECT COUNT(*) as count FROM attendance WHERE branch_id = ? AND DATE(check_in_time) = ?',
      [branchId, today]
    );

    const [[revenue]] = await pool.query(
      'SELECT COALESCE(SUM(final_amount), 0) as total FROM invoices WHERE branch_id = ? AND DATE(created_at) = ?',
      [branchId, today]
    );

    return {
      ...branch,
      todayAttendance: attendance.count,
      todayRevenue: revenue.total
    };
  }
}

module.exports = Branch;
