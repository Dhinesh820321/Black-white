const Attendance = require('../models/Attendance');
const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllAttendance = async (req, res, next) => {
  try {
    const { branch_id, employee_id, date, start_date, end_date, status } = req.query;
    const attendance = await Attendance.findAll({ branch_id, employee_id, date, start_date, end_date, status });
    return successResponse(res, attendance);
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const employeeId = req.user.id;
    const branchId = req.user.branch_id;

    if (!branchId && req.user.role !== 'admin') {
      return errorResponse(res, 'No branch assigned', 400);
    }

    const branchToUse = branchId || req.body.branch_id;
    if (!branchToUse) {
      return errorResponse(res, 'Branch ID required', 400);
    }

    const attendance = await Attendance.checkIn(employeeId, branchToUse, latitude, longitude);
    return successResponse(res, attendance, 'Checked in successfully');
  } catch (error) {
    if (error.message === 'Already checked in today') {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    let { attendance_id, latitude, longitude } = req.body;
    
    if (!attendance_id) {
      const [latest] = await pool.query(
        'SELECT id FROM attendance WHERE employee_id = ? AND status = ? ORDER BY check_in_time DESC LIMIT 1',
        [req.user.id, 'checked_in']
      );
      if (latest.length === 0) {
        return errorResponse(res, 'No active check-in found to check out', 400);
      }
      attendance_id = latest[0].id;
    }

    const attendance = await Attendance.checkOut(attendance_id, latitude, longitude);
    return successResponse(res, attendance, 'Checked out successfully');
  } catch (error) {
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branch_id : req.user.branch_id;
    const attendance = await Attendance.getTodayAttendance(branchId);
    return successResponse(res, attendance);
  } catch (error) {
    next(error);
  }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const summary = await Attendance.getSummary(branch_id, start_date, end_date);
    return successResponse(res, summary);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllAttendance, checkIn, checkOut, getTodayAttendance, getAttendanceSummary };
