const pool = require('../config/database');

class Inventory {
  static async findAll(filters = {}) {
    let query = `
      SELECT i.*, b.name as branch_name
      FROM inventory i 
      JOIN branches b ON i.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.branch_id) {
      query += ' AND i.branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.category) {
      query += ' AND i.category = ?';
      params.push(filters.category);
    }

    if (filters.low_stock) {
      query += ' AND i.remaining_quantity <= i.min_stock_level';
    }

    if (filters.search) {
      query += ' AND i.item_name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY i.item_name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT i.*, b.name as branch_name
       FROM inventory i 
       JOIN branches b ON i.branch_id = b.id
       WHERE i.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO inventory (branch_id, item_name, category, total_quantity, used_quantity, remaining_quantity, unit, min_stock_level, cost_per_unit) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)',
      [data.branch_id, data.item_name, data.category || 'misc', data.total_quantity, data.total_quantity, data.unit || 'pcs', data.min_stock_level || 10, data.cost_per_unit || 0]
    );
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    if (data.total_quantity !== undefined) {
      const current = await this.findById(id);
      const used = current.used_quantity;
      data.remaining_quantity = data.total_quantity - used;
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
      await pool.query(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  static async useInventory(inventoryId, quantity, employeeId, serviceId = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [[item]] = await connection.query(
        'SELECT * FROM inventory WHERE id = ? FOR UPDATE',
        [inventoryId]
      );

      if (item.remaining_quantity < quantity) {
        throw new Error('Insufficient inventory');
      }

      await connection.query(
        'UPDATE inventory SET used_quantity = used_quantity + ?, remaining_quantity = remaining_quantity - ? WHERE id = ?',
        [quantity, quantity, inventoryId]
      );

      await connection.query(
        'INSERT INTO inventory_usage (inventory_id, employee_id, quantity_used, service_id) VALUES (?, ?, ?, ?)',
        [inventoryId, employeeId, quantity, serviceId]
      );

      await connection.commit();
      return this.findById(inventoryId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    await pool.query('DELETE FROM inventory WHERE id = ?', [id]);
    return true;
  }

  static async getLowStockAlerts(branchId = null) {
    let query = `
      SELECT i.*, b.name as branch_name
      FROM inventory i 
      JOIN branches b ON i.branch_id = b.id
      WHERE i.remaining_quantity <= i.min_stock_level
    `;
    const params = [];

    if (branchId) {
      query += ' AND i.branch_id = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getUsageReport(branchId, startDate, endDate) {
    const [rows] = await pool.query(
      `SELECT 
        i.item_name,
        i.category,
        SUM(iu.quantity_used) as total_used,
        COUNT(*) as usage_count
       FROM inventory_usage iu
       JOIN inventory i ON iu.inventory_id = i.id
       WHERE i.branch_id = ? AND DATE(iu.created_at) BETWEEN ? AND ?
       GROUP BY i.id
       ORDER BY total_used DESC`,
      [branchId, startDate, endDate]
    );
    return rows;
  }
}

module.exports = Inventory;
