const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { OTPModel, SessionModel } = require('../models/Auth');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { isWithinRadius } = require('../utils/geofencing');

const ENABLE_GEOFENCING = process.env.ENABLE_GEOFENCING !== 'false';

// ==================== HELPERS ====================

const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '@1';
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (user) => {
  const branchId = user.branch_id?._id || user.branch_id?.id || user.branch_id;
  console.log('🔑 Generate Token - user:', user.name, 'role:', user.role, 'branch_id:', user.branch_id, '-> final branch_id:', branchId);
  
  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
      phone: user.phone,
      branch_id: branchId
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const flattenUser = (user) => {
  const { password, ...safeUser } = user;
  if (safeUser.branch_id && typeof safeUser.branch_id === 'object') {
    safeUser.branch_name = safeUser.branch_id.name;
    safeUser.branch_id = safeUser.branch_id._id || safeUser.branch_id.id;
  }
  return safeUser;
};

// ==================== ADMIN LOGIN ====================

const adminLogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    console.log('🔐 ADMIN LOGIN ATTEMPT:', { phone });

    // Validate inputs
    if (!phone || !password) {
      return errorResponse(res, 'Phone and password are required', 400);
    }

    // Find user by phone
    const user = await User.findByPhone(phone);
    console.log('👤 User found:', user ? { id: user._id, name: user.name, role: user.role } : 'NOT FOUND');

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('❌ Not an admin:', user.role);
      return errorResponse(res, 'Access denied. Admin login only.', 403);
    }

    // Check if account is active
    if (user.status !== 'active') {
      return errorResponse(res, 'Account is inactive', 403);
    }

    // Check password exists
    if (!user.password) {
      return errorResponse(res, 'Password not set. Please reset your password.', 400);
    }

    // Verify password
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error('❌ Bcrypt error:', err.message);
      return errorResponse(res, 'Authentication failed', 500);
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user);

    // Save session
    await SessionModel.create({
      user_id: user._id,
      token,
      device_id: req.body.device_id,
      ip_address: req.ip
    });

    console.log('✅ Admin login successful:', user.name);
    return successResponse(res, {
      token,
      user: flattenUser(user)
    }, 'Admin login successful');

  } catch (error) {
    console.error('❌ ADMIN LOGIN ERROR:', error.message);
    next(error);
  }
};

// ==================== EMPLOYEE LOGIN (WITH GEOFENCING) ====================

const employeeLogin = async (req, res, next) => {
  try {
    const { phone, password, latitude, longitude, device_id } = req.body;
    console.log('🔐 EMPLOYEE LOGIN ATTEMPT:', { phone, hasLocation: !!latitude, geofencingEnabled: ENABLE_GEOFENCING });

    // Validate inputs
    if (!phone || !password) {
      return errorResponse(res, 'Phone and password are required', 400);
    }

    // Find user by phone
    const user = await User.findByPhone(phone);
    console.log('👤 User found:', user ? { id: user._id, name: user.name, role: user.role } : 'NOT FOUND');

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if user is employee
    if (user.role !== 'employee') {
      console.log('❌ Not an employee:', user.role);
      return errorResponse(res, 'Access denied. Employee login only.', 403);
    }

    // Check if account is active
    if (user.status !== 'active') {
      return errorResponse(res, 'Account is inactive', 403);
    }

    // Check password exists
    if (!user.password) {
      return errorResponse(res, 'Password not set. Please contact admin.', 400);
    }

    // Verify password
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error('❌ Bcrypt error:', err.message);
      return errorResponse(res, 'Authentication failed', 500);
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // ==================== GEOFENCING CHECK ====================
    if (ENABLE_GEOFENCING && user.geo_lat && user.geo_long) {
      if (!latitude || !longitude) {
        console.log('❌ Location required for employee login');
        return errorResponse(res, 'Location access required for employee login', 400);
      }

      const radius = user.geo_radius || 100;

      const distance = Math.sqrt(
        Math.pow((latitude - user.geo_lat) * 111000, 2) +
        Math.pow((longitude - user.geo_long) * 111000 * Math.cos(latitude * Math.PI / 180), 2)
      );

      const isInRange = isWithinRadius(
        parseFloat(latitude),
        parseFloat(longitude),
        user.geo_lat,
        user.geo_long,
        radius
      );

      console.log('📍 Geo check:', {
        userLocation: { lat: latitude, lng: longitude },
        branchLocation: { lat: user.geo_lat, lng: user.geo_long },
        radius: radius,
        distance: Math.round(distance),
        isInRange
      });

      if (!isInRange) {
        console.log('❌ Outside branch radius');
        return errorResponse(res, `You must be within ${radius}m of the branch to login. Distance: ${Math.round(distance)}m`, 403);
      }
    }

    // Generate token
    const token = generateToken(user);

    // Save session
    await SessionModel.create({
      user_id: user._id,
      token,
      device_id,
      ip_address: req.ip
    });

    console.log('✅ Employee login successful:', user.name);
    return successResponse(res, {
      token,
      user: flattenUser(user)
    }, 'Employee login successful');

  } catch (error) {
    console.error('❌ EMPLOYEE LOGIN ERROR:', error.message);
    next(error);
  }
};

// ==================== OTP FLOW ====================

const requestOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    console.log('📱 OTP REQUEST:', { phone });

    const user = await User.findByPhone(phone);

    if (!user) {
      return successResponse(res, { message: 'If phone exists, OTP will be sent' });
    }

    if (user.status !== 'active') {
      return successResponse(res, { message: 'If phone exists, OTP will be sent' });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTPModel.create({ phone, otp: hashedOTP, expires_at: expiresAt });

    console.log(`📱 OTP for ${phone}: ${otp} (expires: ${expiresAt})`);

    return successResponse(res, {
      message: 'OTP sent successfully',
      expires_in: '5 minutes',
      demo_otp: otp
    });

  } catch (error) {
    console.error('❌ OTP REQUEST ERROR:', error.message);
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    console.log('🔐 OTP VERIFY:', { phone, otpReceived: otp });

    const otpRecord = await OTPModel.findOne({
      phone,
      expires_at: { $gt: new Date() },
      verified: false
    }).sort({ created_at: -1 });

    console.log('📋 OTP RECORD:', otpRecord ? 'found' : 'not found');
    
    if (!otpRecord) {
      const expiredRecord = await OTPModel.findOne({ phone, verified: false }).sort({ createdAt: -1 });
      if (expiredRecord) {
        console.log('⏰ OTP expired at:', expiredRecord.expires_at);
      }
      return errorResponse(res, 'OTP expired or invalid', 400);
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    console.log('🔑 OTP comparison:', isValid ? 'match' : 'no match');
    if (!isValid) {
      return errorResponse(res, 'Invalid OTP', 400);
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Generate temporary reset token
    const resetToken = jwt.sign(
      { phone, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15 minutes' }
    );

    console.log('✅ OTP verified:', phone);
    return successResponse(res, {
      reset_token: resetToken,
      message: 'OTP verified. Use reset_token to change password.'
    });

  } catch (error) {
    console.error('❌ OTP VERIFY ERROR:', error.message);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { reset_token, new_password } = req.body;
    console.log('🔐 PASSWORD RESET');

    if (!reset_token || !new_password) {
      return errorResponse(res, 'Reset token and new password are required', 400);
    }

    if (new_password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
    } catch (err) {
      return errorResponse(res, 'Invalid or expired reset token', 401);
    }

    if (decoded.purpose !== 'password_reset') {
      return errorResponse(res, 'Invalid token', 401);
    }

    // Find user
    const user = await User.findByPhone(decoded.phone);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await UserModel.findByIdAndUpdate(
      user._id || user.id,
      {
        password: hashedPassword,
        password_changed_at: new Date()
      }
    );

    console.log('✅ Password reset successful:', decoded.phone);
    return successResponse(res, { message: 'Password reset successful' });

  } catch (error) {
    console.error('❌ PASSWORD RESET ERROR:', error.message);
    next(error);
  }
};

// ==================== PROFILE ====================

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    return successResponse(res, flattenUser(user));
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await UserModel.findById(req.user._id || req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const isValid = await bcrypt.compare(current_password, user.password);
    if (!isValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        password_changed_at: new Date()
      }
    );

    return successResponse(res, { message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  employeeLogin,
  requestOTP,
  verifyOTP,
  resetPassword,
  getProfile,
  changePassword,
  generateTempPassword
};
