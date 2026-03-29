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
const pool = require('../config/database');

<<<<<<< HEAD
router.get('/check-admin', async (req, res) => {
  try {
    const [admins] = await pool.query(
      `SELECT id, name, phone, role, status, password_changed_at 
       FROM employees WHERE role = 'admin' LIMIT 1`
    );
    
    if (admins.length === 0) {
      return res.json({ 
        exists: false, 
        message: 'No admin found. Run: node src/scripts/reset-admin.js' 
      });
    }
    
    const admin = admins[0];
    return res.json({
      exists: true,
      admin: {
        id: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        passwordSet: !!admin.password_changed_at
      },
      loginCredentials: {
        phone: admin.phone,
        password: 'admin123'
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      exists: false, 
      error: error.message,
      hint: 'Ensure MySQL is running and database is initialized'
    });
  }
});
=======
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed

/**
 * @swagger
 * /api/auth/login/password:
 *   post:
<<<<<<< HEAD
 *     summary: Login using password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login success
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.post('/login/password', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.passwordLogin);

<<<<<<< HEAD
=======

>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
/**
 * @swagger
 * /api/auth/login/otp/request:
 *   post:
<<<<<<< HEAD
 *     summary: Request OTP
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP sent
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.post('/login/otp/request', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.requestOTP);

<<<<<<< HEAD
=======

>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
/**
 * @swagger
 * /api/auth/login/otp/verify:
 *   post:
<<<<<<< HEAD
 *     summary: Verify OTP
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP verified
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.post('/login/otp/verify', [
  body('phone').notEmpty(),
  body('otp').notEmpty().withMessage('OTP required')
], validate, authController.verifyOTP);

<<<<<<< HEAD
=======

>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
/**
 * @swagger
 * /api/auth/register:
 *   post:
<<<<<<< HEAD
 *     summary: Register employee
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Employee created
 */
router.post('/register', authorize('admin', 'manager'), [
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required'),
  body('role').isIn(['admin', 'manager', 'stylist', 'helper']).withMessage('Invalid role')
], validate, authController.createEmployee);

<<<<<<< HEAD
=======

>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
/**
 * @swagger
 * /api/auth/profile:
 *   get:
<<<<<<< HEAD
 *     summary: Get profile
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.get('/profile', auth, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
<<<<<<< HEAD
 *     summary: Update profile
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.put('/profile', auth, authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
<<<<<<< HEAD
 *     summary: Change password
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password min 6 chars')
], validate, authController.changePassword);

<<<<<<< HEAD
=======

>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
<<<<<<< HEAD
 *     summary: Reset password
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.post('/reset-password', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.resetPassword);

<<<<<<< HEAD
=======

>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
/**
 * @swagger
 * /api/auth/sessions:
 *   get:
<<<<<<< HEAD
 *     summary: Get sessions
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.get('/sessions', auth, authController.getSessions);

/**
 * @swagger
 * /api/auth/sessions/{session_id}:
 *   delete:
<<<<<<< HEAD
 *     summary: Logout session
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.delete('/sessions/:session_id', auth, authController.logoutSession);

/**
 * @swagger
 * /api/auth/update-device:
 *   post:
<<<<<<< HEAD
 *     summary: Update device info
 *     tags: [Auth]
=======
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
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
 */
router.post('/update-device', auth, authController.updateDevice);

module.exports = router;