/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API operations for Payments
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);


/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: GET /api/payments
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
router.get('/', branchAccess, paymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/daily-totals:
 *   get:
 *     tags: [Payments]
 *     summary: GET /api/payments/daily-totals
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
router.get('/daily-totals', branchAccess, paymentController.getDailyTotals);

/**
 * @swagger
 * /api/payments/analytics:
 *   get:
 *     tags: [Payments]
 *     summary: GET /api/payments/analytics
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
router.get('/analytics', branchAccess, paymentController.getAnalytics);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: POST /api/payments
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
router.post('/', authorize('admin', 'manager'), [
  body('branch_id').isInt().withMessage('Branch ID required'),
  body('employee_id').isInt().withMessage('Employee ID required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('payment_type').isIn(['UPI', 'CASH', 'CARD']).withMessage('Invalid payment type')
], validate, paymentController.createPayment);

router.put('/:id', authorize('admin', 'manager'), paymentController.updatePayment);

router.delete('/:id', authorize('admin', 'manager'), paymentController.deletePayment);

module.exports = router;
