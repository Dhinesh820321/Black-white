const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { auth, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getService);
router.post('/', authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required')
], validate, serviceController.createService);
router.put('/:id', authorize('admin', 'manager'), serviceController.updateService);
router.delete('/:id', authorize('admin'), serviceController.deleteService);

module.exports = router;
