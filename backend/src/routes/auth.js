/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API operations for Auth
 */
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
 *     tags: [Auth]
 *     summary: POST /api/auth/login/password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/login/password', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.passwordLogin);


/**
 * @swagger
 * /api/auth/login/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: POST /api/auth/login/otp/request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/login/otp/request', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.requestOTP);


/**
 * @swagger
 * /api/auth/login/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: POST /api/auth/login/otp/verify
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/login/otp/verify', [
  body('phone').notEmpty(),
  body('otp').notEmpty().withMessage('OTP required')
], validate, authController.verifyOTP);


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: POST /api/auth/register
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/register', auth, authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required'),
  body('role').isIn(['admin', 'manager', 'stylist', 'helper']).withMessage('Invalid role')
], validate, authController.createEmployee);


/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: GET /api/auth/profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.get('/profile', auth, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: PUT /api/auth/profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.put('/profile', auth, authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: POST /api/auth/change-password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password min 6 chars')
], validate, authController.changePassword);


/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: POST /api/auth/reset-password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/reset-password', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.resetPassword);


/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: GET /api/auth/sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.get('/sessions', auth, authController.getSessions);

/**
 * @swagger
 * /api/auth/sessions/{session_id}:
 *   delete:
 *     tags: [Auth]
 *     summary: DELETE /api/auth/sessions/{session_id}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.delete('/sessions/:session_id', auth, authController.logoutSession);

/**
 * @swagger
 * /api/auth/update-device:
 *   post:
 *     tags: [Auth]
 *     summary: POST /api/auth/update-device
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/update-device', auth, authController.updateDevice);

module.exports = router;
