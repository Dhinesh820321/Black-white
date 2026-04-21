/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API operations for Dashboard
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth, branchAccess } = require('../middlewares/auth');

router.use(auth);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: GET /api/dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch ID
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
router.get('/', branchAccess, dashboardController.getDashboard);

/**
 * @swagger
 * /api/dashboard/branch-comparison:
 *   get:
 *     tags: [Dashboard]
 *     summary: GET /api/dashboard/branch-comparison
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
router.get('/branch-comparison', auth, dashboardController.getBranchComparison);

/**
 * @swagger
 * /api/dashboard/revenue-trend:
 *   get:
 *     tags: [Dashboard]
 *     summary: GET /api/dashboard/revenue-trend - Get revenue trend for chart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [week, month]
 *         description: Time range (week = 7 days, month = 30 days)
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
router.get('/revenue-trend', branchAccess, dashboardController.getRevenueTrend);

/**
 * @swagger
 * /api/dashboard/revenue-chart:
 *   get:
 *     tags: [Dashboard]
 *     summary: GET /api/dashboard/revenue-chart
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
router.get('/revenue-chart', branchAccess, dashboardController.getRevenueChart);

/**
 * @swagger
 * /api/dashboard/top-performers:
 *   get:
 *     tags: [Dashboard]
 *     summary: GET /api/dashboard/top-performers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Filter by branch ID
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
router.get('/top-performers', branchAccess, dashboardController.getTopPerformers);

module.exports = router;
