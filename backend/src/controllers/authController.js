const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse } = require('../utils/responseHelper');

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
  console.log(`📱 OTP for ${phone}: ${otp}`);
  return true;
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, role, phone, branch_id, salary, send_creds = true } = req.body;

    const [existing] = await pool.query('SELECT id FROM employees WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return errorResponse(res, 'Phone number already registered', 400);
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const employeeId = uuidv4().slice(0, 8).toUpperCase();

    const [result] = await pool.query(
      `INSERT INTO employees (employee_id, name, role, phone, password, branch_id, salary, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [employeeId, name, role, phone, hashedPassword, branch_id || null, salary || 0]
    );

    if (send_creds) {
      await sendOTP(phone, tempPassword);
    }

    return successResponse(res, {
      id: result.insertId,
      employee_id: employeeId,
      name,
      role,
      phone,
      branch_id,
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

    const [employees] = await pool.query(
      'SELECT id, name, role, branch_id FROM employees WHERE phone = ? AND status = ?',
      [phone, 'active']
    );

    if (employees.length === 0) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_verifications (phone, otp, expires_at) VALUES (?, ?, ?)',
      [phone, await bcrypt.hash(otp, 10), expiresAt]
    );

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
    const { phone, otp } = req.body;

    const [verifications] = await pool.query(
      'SELECT * FROM otp_verifications WHERE phone = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [phone]
    );

    if (verifications.length === 0) {
      return errorResponse(res, 'OTP expired or not requested', 400);
    }

    const isValid = await bcrypt.compare(otp, verifications[0].otp);
    if (!isValid) {
      return errorResponse(res, 'Invalid OTP', 400);
    }

    await pool.query('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [verifications[0].id]);

    const [employees] = await pool.query(
      'SELECT id, name, role, phone, branch_id FROM employees WHERE phone = ?',
      [phone]
    );

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: employees[0].id, role: employees[0].role, phone: employees[0].phone },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await pool.query(
      'INSERT INTO auth_sessions (employee_id, token, device_id, login_time) VALUES (?, ?, ?, NOW())',
      [employees[0].id, token, req.body.device_id]
    );

    return successResponse(res, {
      token,
      user: employees[0],
      auth_method: 'otp'
    }, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

const passwordLogin = async (req, res, next) => {
  try {
    const { phone, password, device_id, latitude, longitude } = req.body;

    const [employees] = await pool.query(
      `SELECT e.*, b.geo_latitude, b.geo_longitude, b.geo_radius, b.name as branch_name 
       FROM employees e 
       LEFT JOIN branches b ON e.branch_id = b.id 
       WHERE e.phone = ?`,
      [phone]
    );

    if (employees.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const employee = employees[0];

    if (employee.status !== 'active') {
      return errorResponse(res, 'Account is inactive', 403);
    }

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (employee.geo_latitude && employee.geo_longitude && latitude && longitude) {
      const { isWithinRadius } = require('../utils/geofencing');
      const inRange = isWithinRadius(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(employee.geo_latitude),
        parseFloat(employee.geo_longitude),
        employee.geo_radius || 100
      );

      if (!inRange) {
        return errorResponse(res, 'Outside allowed location. Check in from your assigned branch.', 403);
      }
    }

    if (device_id && employee.device_id && employee.device_id !== device_id) {
      console.log(`⚠️ Device mismatch for ${employee.name}: registered ${employee.device_id}, login attempt from ${device_id}`);
    }

    if (device_id && !employee.device_id) {
      await pool.query('UPDATE employees SET device_id = ? WHERE id = ?', [device_id, employee.id]);
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: employee.id, role: employee.role, phone: employee.phone, branch_id: employee.branch_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await pool.query(
      'INSERT INTO auth_sessions (employee_id, token, device_id, login_time, ip_address) VALUES (?, ?, ?, NOW(), ?)',
      [employee.id, token, device_id, req.ip]
    );

    const { password: _, ...safeEmployee } = employee;

    return successResponse(res, {
      token,
      user: safeEmployee,
      is_first_login: employee.password_changed_at === null
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const employeeId = req.user.id;

    const [employees] = await pool.query('SELECT password FROM employees WHERE id = ?', [employeeId]);
    
    if (employees.length === 0) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, employees[0].password);
    if (!isValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE employees SET password = ?, password_changed_at = NOW() WHERE id = ?',
      [hashedPassword, employeeId]
    );

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    const [employees] = await pool.query('SELECT id, name FROM employees WHERE phone = ?', [phone]);
    if (employees.length === 0) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query('UPDATE employees SET password = ?, password_changed_at = NULL WHERE id = ?', 
      [hashedPassword, employees[0].id]);

    await sendOTP(phone, tempPassword);

    return successResponse(res, {
      message: 'Temporary password sent via SMS',
      demo_password: tempPassword
    });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const [sessions] = await pool.query(
      `SELECT id, device_id, login_time, ip_address, logout_time 
       FROM auth_sessions 
       WHERE employee_id = ? 
       ORDER BY login_time DESC LIMIT 10`,
      [req.user.id]
    );

    return successResponse(res, sessions);
  } catch (error) {
    next(error);
  }
};

const logoutSession = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    
    await pool.query(
      'UPDATE auth_sessions SET logout_time = NOW() WHERE id = ? AND employee_id = ?',
      [session_id, req.user.id]
    );

    return successResponse(res, null, 'Session logged out');
  } catch (error) {
    next(error);
  }
};

const updateDevice = async (req, res, next) => {
  try {
    const { new_device_id } = req.body;
    const employeeId = req.user.id;

    await pool.query('UPDATE employees SET device_id = ? WHERE id = ?', [new_device_id, employeeId]);

    return successResponse(res, null, 'Device updated successfully');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const [employees] = await pool.query(
      `SELECT e.id, e.employee_id, e.name, e.role, e.phone, e.branch_id, e.salary, e.status, b.name as branch_name
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.id = ?`,
      [req.user.id]
    );

    if (employees.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, employees[0]);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (updates.length > 0) {
      params.push(req.user.id);
      await pool.query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return getProfile(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  requestOTP,
  verifyOTP,
  passwordLogin,
  changePassword,
  resetPassword,
  getSessions,
  logoutSession,
  updateDevice,
  getProfile,
  updateProfile
};
