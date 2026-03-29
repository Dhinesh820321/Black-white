const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

/**
 * @swagger
 * /api/auth/login/password:
 *   post:
 *     summary: Login using password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login success
 */
router.post('/login/password', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.passwordLogin);

/**
 * @swagger
 * /api/auth/login/otp/request:
 *   post:
 *     summary: Request OTP
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/login/otp/request', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.requestOTP);

/**
 * @swagger
 * /api/auth/login/otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post('/login/otp/verify', [
  body('phone').notEmpty(),
  body('otp').notEmpty().withMessage('OTP required')
], validate, authController.verifyOTP);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register employee
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Employee created
 */
router.post('/register', authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required'),
  body('role').isIn(['admin', 'manager', 'stylist', 'helper']).withMessage('Invalid role')
], validate, authController.createEmployee);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get profile
 *     tags: [Auth]
 */
router.get('/profile', auth, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update profile
 *     tags: [Auth]
 */
router.put('/profile', auth, authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 */
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password min 6 chars')
], validate, authController.changePassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 */
router.post('/reset-password', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.resetPassword);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get sessions
 *     tags: [Auth]
 */
router.get('/sessions', auth, authController.getSessions);

/**
 * @swagger
 * /api/auth/sessions/{session_id}:
 *   delete:
 *     summary: Logout session
 *     tags: [Auth]
 */
router.delete('/sessions/:session_id', auth, authController.logoutSession);

/**
 * @swagger
 * /api/auth/update-device:
 *   post:
 *     summary: Update device info
 *     tags: [Auth]
 */
router.post('/update-device', auth, authController.updateDevice);

module.exports = router;