const pool = require('../config/database');

class Attendance {
  static async findAll(filters = {}) {
    let query = `
      SELECT a.*, e.name as employee_name, b.name as branch_name 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id 
      JOIN branches b ON a.branch_id = b.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.branch_id) {
      query += ' AND a.branch_id = ?';
      params.push(filters.branch_id);
    }

    if (filters.employee_id) {
      query += ' AND a.employee_id = ?';
      params.push(filters.employee_id);
    }

    if (filters.date) {
      query += ' AND DATE(a.check_in_time) = ?';
      params.push(filters.date);
    }

    if (filters.start_date && filters.end_date) {
      query += ' AND DATE(a.check_in_time) BETWEEN ? AND ?';
      params.push(filters.start_date, filters.end_date);
    }

    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY a.check_in_time DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async checkIn(employeeId, branchId, lat, lng) {
    const [existing] = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND DATE(check_in_time) = CURDATE() AND status = ?',
      [employeeId, 'checked_in']
    );

    if (existing.length > 0) {
      throw new Error('Already checked in today');
    }

    const [result] = await pool.query(
      'INSERT INTO attendance (employee_id, branch_id, check_in_time, check_in_lat, check_in_lng, status) VALUES (?, ?, NOW(), ?, ?, ?)',
      [employeeId, branchId, lat, lng, 'checked_in']
    );

    return { id: result.insertId, employee_id: employeeId, status: 'checked_in' };
  }

  static async checkOut(attendanceId, lat, lng) {
    const [[attendance]] = await pool.query(
      'SELECT TIMESTAMPDIFF(MINUTE, check_in_time, NOW()) as minutes FROM attendance WHERE id = ?',
      [attendanceId]
    );

    const workingHours = (attendance.minutes / 60).toFixed(2);

    await pool.query(
      'UPDATE attendance SET check_out_time = NOW(), check_out_lat = ?, check_out_lng = ?, working_hours = ?, status = ? WHERE id = ?',
      [lat, lng, workingHours, 'checked_out', attendanceId]
    );

    return this.findById(attendanceId);
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT a.*, e.name as employee_name, b.name as branch_name 
       FROM attendance a 
       JOIN employees e ON a.employee_id = e.id 
       JOIN branches b ON a.branch_id = b.id 
       WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getTodayAttendance(branchId) {
    const [rows] = await pool.query(
      `SELECT a.*, e.name as employee_name, e.role 
       FROM attendance a 
       JOIN employees e ON a.employee_id = e.id 
       WHERE a.branch_id = ? AND DATE(a.check_in_time) = CURDATE()
       ORDER BY a.check_in_time DESC`,
      [branchId]
    );
    return rows;
  }

  static async getSummary(branchId, startDate, endDate) {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out,
        AVG(working_hours) as avg_working_hours,
        SUM(working_hours) as total_working_hours
       FROM attendance 
       WHERE branch_id = ? AND DATE(check_in_time) BETWEEN ? AND ?`,
      [branchId, startDate, endDate]
    );
    return rows[0];
  }
}

module.exports = Attendance;
