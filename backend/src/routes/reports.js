/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API operations for Reports
 */
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');

router.use(auth);


/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     tags: [Reports]
 *     summary: GET /api/reports/daily
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
router.get('/daily', branchAccess, reportsController.getDailyReport);

/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     tags: [Reports]
 *     summary: GET /api/reports/monthly
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
router.get('/monthly', branchAccess, reportsController.getMonthlyReport);

/**
 * @swagger
 * /api/reports/branch-performance:
 *   get:
 *     tags: [Reports]
 *     summary: GET /api/reports/branch-performance
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
router.get('/branch-performance', authorize('admin'), reportsController.getBranchPerformanceReport);

/**
 * @swagger
 * /api/reports/employee-performance:
 *   get:
 *     tags: [Reports]
 *     summary: GET /api/reports/employee-performance
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
router.get('/employee-performance', branchAccess, reportsController.getEmployeePerformanceReport);

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     tags: [Reports]
 *     summary: GET /api/reports/export
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
router.get('/export', authorize('admin', 'manager'), reportsController.exportReport);

module.exports = router;
