const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', branchAccess, inventoryController.getAllInventory);
router.get('/low-stock', inventoryController.getLowStockAlerts);
router.get('/usage-report', branchAccess, inventoryController.getUsageReport);
router.get('/:id', inventoryController.getInventoryItem);
router.post('/', authorize('admin', 'manager'), [
  body('branch_id').isInt().withMessage('Branch ID required'),
  body('item_name').notEmpty().withMessage('Item name required'),
  body('total_quantity').isInt({ min: 0 }).withMessage('Valid quantity required')
], validate, inventoryController.createInventoryItem);
router.put('/:id', authorize('admin', 'manager'), inventoryController.updateInventoryItem);
router.post('/use', authorize('admin', 'manager', 'stylist'), [
  body('inventory_id').isInt().withMessage('Inventory ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity required')
], validate, inventoryController.useInventory);
router.delete('/:id', authorize('admin'), inventoryController.deleteInventoryItem);

module.exports = router;
