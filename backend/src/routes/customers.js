const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', customerController.getAllCustomers);
router.get('/retention-alerts', customerController.getRetentionAlerts);
router.get('/:id', customerController.getCustomer);
router.get('/:id/visit-history', customerController.getVisitHistory);
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
