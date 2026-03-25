const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Invoice {
  static async findAll(filters = {}) {
    let query = `
      SELECT i.*, e.name as employee_name, c.name as customer_name, b.name as branch_name
      FROM invoices i 
      JOIN employees e ON i.employee_id = e.id 
      JOIN branches b ON i.branch_id = b.id 
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.branch_id) {
      query += ' AND i.branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.customer_id) {
      query += ' AND i.customer_id = ?';
      params.push(filters.customer_id);
    }

    if (filters.employee_id) {
      query += ' AND i.employee_id = ?';
      params.push(filters.employee_id);
    }

    if (filters.payment_type) {
      query += ' AND i.payment_type = ?';
      params.push(filters.payment_type);
    }

    if (filters.date) {
      query += ' AND DATE(i.created_at) = ?';
      params.push(filters.date);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND DATE(i.created_at) BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    if (filters.month && filters.year) {
      query += ' AND MONTH(i.created_at) = ? AND YEAR(i.created_at) = ?';
      params.push(filters.month, filters.year);
    }

    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [invoices] = await pool.query(
      `SELECT i.*, e.name as employee_name, c.name as customer_name, b.name as branch_name
       FROM invoices i 
       JOIN employees e ON i.employee_id = e.id 
       JOIN branches b ON i.branch_id = b.id 
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`,
      [id]
    );

    if (invoices.length === 0) return null;

    const [items] = await pool.query(
      `SELECT ii.*, s.name as service_name 
       FROM invoice_items ii 
       JOIN services s ON ii.service_id = s.id 
       WHERE ii.invoice_id = ?`,
      [id]
    );

    return { ...invoices[0], items };
  }

  static async create(data) {
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO invoices (branch_id, customer_id, employee_id, invoice_number, total_amount, tax_amount, discount, final_amount, payment_type, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.branch_id, data.customer_id || null, data.employee_id, invoiceNumber, data.total_amount, data.tax_amount, data.discount || 0, data.final_amount, data.payment_type, data.notes || null]
      );

      const invoiceId = result.insertId;

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await connection.query(
            'INSERT INTO invoice_items (invoice_id, service_id, quantity, price, gst_percentage, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
            [invoiceId, item.service_id, item.quantity || 1, item.price, item.gst_percentage, item.subtotal]
          );
        }
      }

      if (data.customer_id) {
        await connection.query(
          'UPDATE customers SET last_visit = CURDATE(), loyalty_points = loyalty_points + ? WHERE id = ?',
          [Math.floor(data.final_amount / 100), data.customer_id]
        );
      }

      await connection.query(
        'INSERT INTO payments (branch_id, employee_id, invoice_id, amount, payment_type) VALUES (?, ?, ?, ?, ?)',
        [data.branch_id, data.employee_id, invoiceId, data.final_amount, data.payment_type]
      );

      await connection.commit();
      return this.findById(invoiceId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getDailyRevenue(branchId, date) {
    const [rows] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_type = 'UPI' THEN final_amount ELSE 0 END), 0) as upi,
        COALESCE(SUM(CASE WHEN payment_type = 'CASH' THEN final_amount ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN payment_type = 'CARD' THEN final_amount ELSE 0 END), 0) as card,
        COALESCE(SUM(final_amount), 0) as total,
        COUNT(*) as invoice_count
       FROM invoices 
       WHERE branch_id = ? AND DATE(created_at) = ? AND status = 'completed'`,
      [branchId, date]
    );
    return rows[0];
  }

  static async getMonthlyRevenue(branchId, year, month) {
    const [rows] = await pool.query(
      `SELECT 
        DAY(created_at) as day,
        SUM(final_amount) as revenue,
        COUNT(*) as invoices
       FROM invoices 
       WHERE branch_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ? AND status = 'completed'
       GROUP BY DAY(created_at)
       ORDER BY day`,
      [branchId, year, month]
    );
    return rows;
  }
}

module.exports = Invoice;
