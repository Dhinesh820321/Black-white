/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: API operations for Attendance
 */
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, branchAccess } = require('../middlewares/auth');

router.use(auth);

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: GET /api/attendance
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
router.get('/', branchAccess, attendanceController.getAllAttendance);

/**
 * @swagger
 * /api/attendance/today:
 *   get:
 *     tags: [Attendance]
 *     summary: GET /api/attendance/today
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
router.get('/today', attendanceController.getTodayAttendance);

/**
 * @swagger
 * /api/attendance/me/today:
 *   get:
 *     tags: [Attendance]
 *     summary: GET /api/attendance/me/today - Get current employee's today's attendance
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
router.get('/me/today', attendanceController.getEmployeeToday);

/**
 * @swagger
 * /api/attendance/history:
 *   get:
 *     tags: [Attendance]
 *     summary: GET /api/attendance/history - Get current employee's attendance history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *         description: Filter by time period
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
router.get('/history', attendanceController.getHistory);

/**
 * @swagger
 * /api/attendance/summary:
 *   get:
 *     tags: [Attendance]
 *     summary: GET /api/attendance/summary
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
router.get('/summary', branchAccess, attendanceController.getAttendanceSummary);

/**
 * @swagger
 * /api/attendance/check-in:
 *   post:
 *     tags: [Attendance]
 *     summary: POST /api/attendance/check-in
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
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
router.post('/check-in', attendanceController.checkIn);

/**
 * @swagger
 * /api/attendance/check-out:
 *   post:
 *     tags: [Attendance]
 *     summary: POST /api/attendance/check-out
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
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
router.post('/check-out', attendanceController.checkOut);

module.exports = router;
