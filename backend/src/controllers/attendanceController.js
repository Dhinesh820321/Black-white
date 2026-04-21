const Attendance = require('../models/Attendance');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllAttendance = async (req, res, next) => {
  try {
    const { branch_id, employee_id, date, start_date, end_date, filter } = req.query;
    const attendance = await Attendance.findAll({ 
      branch_id, 
      employee_id, 
      date, 
      start_date, 
      end_date,
      filter 
    });
    
    const formatted = attendance.map(record => {
      if (record.branch_id && typeof record.branch_id === 'object') {
        record.branch_name = record.branch_id.name;
        record.branch_id = record.branch_id._id || record.branch_id.id;
      }
      if (record.employee_id && typeof record.employee_id === 'object') {
        record.employee_name = record.employee_id.name;
        record.employee_role = record.employee_id.role;
        record.employee_id = record.employee_id._id || record.employee_id.id;
      }
      record.status = Attendance.calculateStatusFromRecord(record);
      record.working_minutes = Attendance.calculateWorkingMinutesFromRecord(record);
      return record;
    });
    
    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const branchId = req.user.branch_id;
    const { location } = req.body;

    if (!branchId && req.user.role !== 'admin') {
      return errorResponse(res, 'No branch assigned', 400);
    }

    const attendance = await Attendance.checkIn(employeeId, branchId, location);
    
    return successResponse(res, attendance, 'Checked in successfully');
  } catch (error) {
    if (error.message === 'Already checked in') {
      return errorResponse(res, 'Already checked in', 400);
    }
    if (error.message === 'Already checked out for today') {
      return errorResponse(res, 'Already checked out for today', 400);
    }
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const attendance = await Attendance.checkOut(employeeId);
    return successResponse(res, attendance, 'Checked out successfully');
  } catch (error) {
    if (error.message === 'No check-in found for today' || error.message === 'Check-in required first') {
      return errorResponse(res, 'Check-in required first', 400);
    }
    if (error.message === 'Already checked out') {
      return errorResponse(res, 'Already checked out', 400);
    }
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    let branchId = req.user.role === 'admin' ? req.query.branch_id : req.user.branch_id;
    if (!branchId) return successResponse(res, []);
    const attendance = await Attendance.getTodayAttendance(branchId);
    
    const formatted = attendance.map(record => {
      if (record.employee_id && typeof record.employee_id === 'object') {
        record.employee_name = record.employee_id.name;
        record.employee_id = record.employee_id._id || record.employee_id.id;
      }
      record.status = Attendance.calculateStatusFromRecord(record);
      record.working_minutes = Attendance.calculateWorkingMinutesFromRecord(record);
      return record;
    });
    
    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

const getEmployeeToday = async (req, res, next) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const attendance = await Attendance.getEmployeeToday(employeeId);
    
    if (!attendance) {
      return successResponse(res, {
        checked_in: null,
        checked_out: null,
        status: 'Not Checked In',
        working_minutes: 0,
        location: null
      });
    }
    
    return successResponse(res, {
      check_in: attendance.check_in_time,
      check_out: attendance.check_out_time,
      status: attendance.status || Attendance.calculateStatusFromRecord(attendance),
      working_minutes: attendance.working_minutes || Attendance.calculateWorkingMinutesFromRecord(attendance),
      location: attendance.location
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const { filter } = req.query;
    
    const history = await Attendance.getHistory(employeeId, { filter });
    
    const formatted = history.map(record => ({
      id: record._id,
      date: record.date,
      start_time: record.check_in_time,
      end_time: record.check_out_time,
      status: record.status || Attendance.calculateStatusFromRecord(record),
      working_minutes: record.working_minutes || Attendance.calculateWorkingMinutesFromRecord(record),
      location: record.location,
      created_at: record.created_at
    }));
    
    return successResponse(res, { attendance: formatted });
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

Attendance.calculateStatusFromRecord = function(record) {
  if (!record.check_in_time) {
    return 'Not Checked In';
  }
  if (record.check_in_time && !record.check_out_time) {
    return 'In Progress';
  }
  return 'Completed';
};

Attendance.calculateWorkingMinutesFromRecord = function(record) {
  if (!record.check_in_time || !record.check_out_time) {
    return 0;
  }
  const diff = (new Date(record.check_out_time) - new Date(record.check_in_time)) / (1000 * 60);
  return Math.max(0, Math.floor(diff));
};

module.exports = { 
  getAllAttendance, 
  checkIn, 
  checkOut, 
  getTodayAttendance,
  getEmployeeToday,
  getHistory,
  getAttendanceSummary 
};
