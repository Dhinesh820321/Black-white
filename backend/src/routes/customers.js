/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API operations for Customers
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', customerController.getAllCustomers);

/**
 * @swagger
 * /api/customers/retention-alerts:
 *   get:
 *     tags: [Customers]
 *     summary: GET /api/customers/retention-alerts
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
router.get('/retention-alerts', customerController.getRetentionAlerts);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: GET /api/customers/{id}
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
router.get('/:id', customerController.getCustomer);

/**
 * @swagger
 * /api/customers/{id}/visit-history:
 *   get:
 *     tags: [Customers]
 *     summary: GET /api/customers/{id}/visit-history
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
router.get('/:id/visit-history', customerController.getVisitHistory);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     tags: [Customers]
 *     summary: POST /api/customers
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
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     tags: [Customers]
 *     summary: PUT /api/customers/{id}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.put('/:id', customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     tags: [Customers]
 *     summary: DELETE /api/customers/{id}
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
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
