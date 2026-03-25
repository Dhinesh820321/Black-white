const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { auth, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranch);
router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('location').notEmpty().withMessage('Location is required')
], validate, branchController.createBranch);
router.put('/:id', authorize('admin'), branchController.updateBranch);
router.delete('/:id', authorize('admin'), branchController.deleteBranch);

module.exports = router;
