const pool = require('../config/database');

class Service {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO services (name, price, gst_percentage, duration_minutes, commission_percentage, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.price, data.gst_percentage || 18, data.duration_minutes || 30, data.commission_percentage || 0, data.status || 'active']
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
      await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Service;
