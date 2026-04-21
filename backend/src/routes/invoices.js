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

router.put('/:id', invoiceController.updateInvoice);

router.delete('/:id', async (req, res, next) => {
  try {
    const Invoice = require('../models/Invoice');
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
});

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
  body().custom((value, { req }) => {
    const items = req.body.items || req.body.services;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('At least one service item is required');
    }
    return true;
  }),
  body('payment_type').isIn(['UPI', 'CASH', 'CARD']).withMessage('Invalid payment type')
], validate, invoiceController.createInvoice);

module.exports = router;
