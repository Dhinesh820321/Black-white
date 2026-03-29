const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
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
      const AttendanceModel = mongoose.model('Attendance');
      const latest = await AttendanceModel.findOne({ 
        employee_id: req.user._id || req.user.id, 
        status: 'checked_in' 
      }).sort({ check_in_time: -1 });

      if (!latest) {
        return errorResponse(res, 'No active check-in found to check out', 400);
      }
      attendance_id = latest._id;
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
