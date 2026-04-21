/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API operations for Reports
 */
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { exportReportPDF } = require('../controllers/pdfExportController');
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
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Success
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
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2026)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month (1-12)
 *     responses:
 *       200:
 *         description: Success
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
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by specific branch
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Success
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
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Success
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
 */
router.get('/export', authorize('admin', 'manager'), reportsController.exportReport);

/**
 * @swagger
 * /api/reports/export-pdf:
 *   post:
 *     tags: [Reports]
 *     summary: POST /api/reports/export-pdf - Export report as PDF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [daily, monthly]
 *               date:
 *                 type: string
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               branchId:
 *                 type: string
 *     responses:
 *       200:
 *         description: PDF file
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/export-pdf', authorize('admin', 'manager'), exportReportPDF);

/**
 * @swagger
 * /api/reports/daily-collection:
 *   get:
 *     tags: [Reports]
 *     summary: GET /api/reports/daily-collection - Get daily collection details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/daily-collection', branchAccess, reportsController.getDailyCollection);

/**
 * @swagger
 * /api/reports/export-collection-pdf:
 *   post:
 *     tags: [Reports]
 *     summary: POST /api/reports/export-collection-pdf - Export daily collection as PDF
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file
 */
router.post('/export-collection-pdf', authorize('admin', 'manager'), reportsController.exportCollectionPDF);

module.exports = router;
