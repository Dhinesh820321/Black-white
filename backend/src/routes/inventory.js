/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: API operations for Inventory
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);


/**
 * @swagger
 * /api/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: GET /api/inventory
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
router.get('/', branchAccess, inventoryController.getAllInventory);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     tags: [Inventory]
 *     summary: GET /api/inventory/low-stock
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
router.get('/low-stock', inventoryController.getLowStockAlerts);

/**
 * @swagger
 * /api/inventory/usage-report:
 *   get:
 *     tags: [Inventory]
 *     summary: GET /api/inventory/usage-report
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
router.get('/usage-report', branchAccess, inventoryController.getUsageReport);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: GET /api/inventory/{id}
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
router.get('/:id', inventoryController.getInventoryItem);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: POST /api/inventory
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
  body('item_name').notEmpty().withMessage('Item name required'),
  body('total_quantity').isInt({ min: 0 }).withMessage('Valid quantity required')
], validate, inventoryController.createInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     tags: [Inventory]
 *     summary: PUT /api/inventory/{id}
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
router.put('/:id', authorize('admin', 'manager'), inventoryController.updateInventoryItem);

/**
 * @swagger
 * /api/inventory/use:
 *   post:
 *     tags: [Inventory]
 *     summary: POST /api/inventory/use
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
router.post('/use', authorize('admin', 'manager', 'stylist'), [
  body('inventory_id').isInt().withMessage('Inventory ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity required')
], validate, inventoryController.useInventory);

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: DELETE /api/inventory/{id}
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
router.delete('/:id', authorize('admin'), inventoryController.deleteInventoryItem);

module.exports = router;
