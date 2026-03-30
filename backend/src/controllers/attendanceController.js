const Attendance = require('../models/Attendance');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllAttendance = async (req, res, next) => {
  try {
    const { branch_id, employee_id, date, start_date, end_date } = req.query;
    let attendance = await Attendance.findAll({ branch_id, employee_id, date, start_date, end_date });
    attendance = attendance.map(record => {
      if (record.branch_id && typeof record.branch_id === 'object') {
        record.branch_name = record.branch_id.name;
        record.branch_id = record.branch_id._id || record.branch_id.id;
      }
      if (record.employee_id && typeof record.employee_id === 'object') {
        record.employee_name = record.employee_id.name;
        record.employee_role = record.employee_id.role;
        record.employee_id = record.employee_id._id || record.employee_id.id;
      }
      return record;
    });
    return successResponse(res, attendance);
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const branchId = req.user.branch_id;

    if (!branchId && req.user.role !== 'admin') {
      return errorResponse(res, 'No branch assigned', 400);
    }

    const attendance = await Attendance.checkIn(employeeId, branchId);
    return successResponse(res, attendance, attendance.message);
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const attendance = await Attendance.checkOut(employeeId);
    return successResponse(res, attendance, 'Check-out updated');
  } catch (error) {
    if (error.message === 'No check-in found for today') {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    let branchId = req.user.role === 'admin' ? req.query.branch_id : req.user.branch_id;
    if (!branchId) return successResponse(res, []);
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
