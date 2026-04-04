/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API endpoints
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const User = require('../models/User');
const upload = require('../config/upload');

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/auth/check-admin:
 *   get:
 *     tags: [Auth]
 *     summary: Check if admin exists
 *     responses:
 *       200:
 *         description: Admin check result
 */
router.get('/check-admin', async (req, res) => {
  try {
    const UserModel = require('mongoose').model('User');
    const admin = await UserModel.findOne({ role: 'admin' }).lean();

    if (!admin) {
      return res.json({
        exists: false,
        message: 'No admin found. Server will auto-seed admin on restart.'
      });
    }

    return res.json({
      exists: true,
      admin: {
        id: admin._id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        status: admin.status
      },
      loginCredentials: {
        phone: admin.phone,
        password: 'admin123'
      }
    });
  } catch (error) {
    return res.status(500).json({
      exists: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin login (phone + password)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Not an admin
 */
router.post('/admin/login', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.adminLogin);

/**
 * @swagger
 * /api/auth/employee/login:
 *   post:
 *     tags: [Auth]
 *     summary: Employee login (with geofencing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *               - latitude
 *               - longitude
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               device_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Outside branch radius
 */
router.post('/employee/login', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.employeeLogin);

/**
 * @swagger
 * /api/auth/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request OTP for password reset
 */
router.post('/otp/request', [
  body('phone').notEmpty().withMessage('Phone is required')
], validate, authController.requestOTP);

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP
 */
router.post('/otp/verify', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('otp').notEmpty().withMessage('OTP is required')
], validate, authController.verifyOTP);

/**
 * @swagger
 * /api/auth/password/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with reset token
 */
router.post('/password/reset', [
  body('reset_token').notEmpty().withMessage('Reset token is required'),
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, authController.resetPassword);

// ==================== PROTECTED ROUTES ====================

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', auth, authController.getProfile);

/**
 * @swagger
 * /api/auth/password/change:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (logged in)
 *     security:
 *       - bearerAuth: []
 */
router.post('/password/change', auth, [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, authController.changePassword);

router.post('/upload-profile-image', auth, upload.single('image'), authController.uploadProfileImage);

// ==================== LEGACY ROUTES (for backward compatibility) ====================

router.post('/login/password', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, (req, res, next) => {
  const UserModel = require('mongoose').model('User');
  UserModel.findOne({ phone: req.body.phone }).lean()
    .then(user => {
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (user.role === 'admin') {
        return authController.adminLogin(req, res, next);
      } else {
        return authController.employeeLogin(req, res, next);
      }
    })
    .catch(err => next(err));
});

module.exports = router;
