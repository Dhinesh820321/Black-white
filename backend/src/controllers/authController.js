const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const Employee = require('../models/Employee');
const { OTPModel, SessionModel } = require('../models/Auth');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '@1';
};

const sendOTP = async (phone, otp) => {
  console.log(`📱 OTP/Credentials for ${phone}: ${otp}`);
  return true;
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, role, phone, branch_id, salary, send_creds = true } = req.body;

    const existing = await Employee.findByPhone(phone);
    if (existing) {
      return errorResponse(res, 'Phone number already registered', 400);
    }

    const tempPassword = generateTempPassword();
    const employee = await Employee.create({
      name, role, phone, password: tempPassword, branch_id, salary
    });

    if (send_creds) {
      await sendOTP(phone, tempPassword);
    }

    return successResponse(res, {
      ...employee,
      temp_password: send_creds ? tempPassword : undefined,
      message: send_creds ? 'Credentials sent via SMS' : 'Employee created successfully'
    }, 'Employee created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const requestOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const employee = await Employee.findByPhone(phone);

    if (!employee || employee.status !== 'active') {
      return errorResponse(res, 'Employee not found or inactive', 404);
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTPModel.create({ phone, otp: hashedOTP, expires_at: expiresAt });
    await sendOTP(phone, otp);

    return successResponse(res, {
      message: 'OTP sent successfully',
      expires_in: '5 minutes',
      demo_otp: otp
    });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, device_id } = req.body;

    const otpRecord = await OTPModel.findOne({ phone, expires_at: { $gt: new Date() } }).sort({ created_at: -1 });

    if (!otpRecord) {
      return errorResponse(res, 'OTP expired or not requested', 400);
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      return errorResponse(res, 'Invalid OTP', 400);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const employee = await Employee.findByPhone(phone);
    const token = jwt.sign(
      { id: employee._id || employee.id, role: employee.role, phone: employee.phone },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await SessionModel.create({ employee_id: employee._id || employee.id, token, device_id, ip_address: req.ip });

    return successResponse(res, { token, user: employee, auth_method: 'otp' }, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

const passwordLogin = async (req, res, next) => {
  try {
    const { phone, password, device_id, latitude, longitude } = req.body;

    const employee = await Employee.findByPhone(phone);

    if (!employee) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (employee.status !== 'active') {
      return errorResponse(res, 'Account is inactive', 403);
    }

    const isValidPassword = await bcrypt.compare(password, employee.password);
    // Geofencing logic (if branch has coordinates)
    if (employee.geo_latitude && latitude) {
      const { isWithinRadius } = require('../utils/geofencing');
      const inRange = isWithinRadius(
        parseFloat(latitude), parseFloat(longitude),
        employee.geo_latitude, employee.geo_longitude,
        employee.geo_radius || 100
      );
      if (!inRange) {
        return errorResponse(res, 'Outside allowed location.', 403);
      }
    }

    const token = jwt.sign(
      { id: employee._id || employee.id, role: employee.role, phone: employee.phone, branch_id: employee.branch_id?._id || employee.branch_id?.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await SessionModel.create({ employee_id: employee._id || employee.id, token, device_id, ip_address: req.ip });

    const { password: _, ...safeEmployee } = employee;
    return successResponse(res, {
      token,
      user: safeEmployee,
      is_first_login: !employee.password_changed_at
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const employee = await Employee.findById(req.user._id || req.user.id);

    if (!employee) return errorResponse(res, 'User not found', 404);

    const isValid = await Employee.verifyPassword(currentPassword, employee.password);
    if (!isValid) return errorResponse(res, 'Current password incorrect', 400);

    await Employee.update(req.user._id || req.user.id, { 
      password: newPassword, 
      password_changed_at: new Date() 
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const employee = await Employee.findByPhone(phone);
    if (!employee) return errorResponse(res, 'Employee not found', 404);

    const tempPassword = generateTempPassword();
    await Employee.update(employee._id || employee.id, { 
      password: tempPassword, 
      password_changed_at: null 
    });

    await sendOTP(phone, `Temporary password: ${tempPassword}`);
    return successResponse(res, { message: 'Temp password sent', demo_password: tempPassword });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await SessionModel.find({ employee_id: req.user._id || req.user.id })
      .sort({ login_time: -1 }).limit(10).lean();
    return successResponse(res, sessions);
  } catch (error) {
    next(error);
  }
};

const logoutSession = async (req, res, next) => {
  try {
    await SessionModel.findByIdAndUpdate(req.params.session_id, { $set: { logout_time: new Date() } });
    return successResponse(res, null, 'Session logged out');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.user._id || req.user.id);
    return successResponse(res, employee);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const employee = await Employee.update(req.user._id || req.user.id, req.body);
    return successResponse(res, employee);
  } catch (error) {
    next(error);
  }
};

const updateDevice = async (req, res, next) => {
  try {
    const { new_device_id } = req.body;
    await Employee.update(req.user._id || req.user.id, { device_id: new_device_id });
    return successResponse(res, null, 'Device updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee, requestOTP, verifyOTP, passwordLogin,
  changePassword, resetPassword, getSessions, logoutSession,
  getProfile, updateProfile, updateDevice
};
