/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: API operations for Invoices
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);


/**
 * @swagger
 * /api/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: GET /api/invoices
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
router.get('/', branchAccess, invoiceController.getAllInvoices);

/**
 * @swagger
 * /api/invoices/daily-revenue:
 *   get:
 *     tags: [Invoices]
 *     summary: GET /api/invoices/daily-revenue
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
router.get('/daily-revenue', branchAccess, invoiceController.getDailyRevenue);

/**
 * @swagger
 * /api/invoices/monthly-revenue:
 *   get:
 *     tags: [Invoices]
 *     summary: GET /api/invoices/monthly-revenue
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
router.get('/monthly-revenue', branchAccess, invoiceController.getMonthlyRevenue);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: GET /api/invoices/{id}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id', invoiceController.getInvoice);

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: POST /api/invoices
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
router.post('/', [
  body('branch_id').isInt().withMessage('Branch ID required'),
  body('employee_id').isInt().withMessage('Employee ID required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('payment_type').isIn(['UPI', 'CASH', 'CARD']).withMessage('Invalid payment type')
], validate, invoiceController.createInvoice);

module.exports = router;
