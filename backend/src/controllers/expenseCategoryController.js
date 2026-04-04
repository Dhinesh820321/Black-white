const ExpenseCategory = require('../models/ExpenseCategory');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllCategories = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let categories = await ExpenseCategory.findAll({ status, search });
    return successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

const getActiveCategories = async (req, res, next) => {
  try {
    const categories = await ExpenseCategory.findActive();
    return successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }
    return successResponse(res, category);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return errorResponse(res, 'Category name is required', 400);
    }

    const existing = await ExpenseCategory.findAll({ search: name.trim() });
    if (existing.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      return errorResponse(res, 'Category with this name already exists', 400);
    }

    const category = await ExpenseCategory.create({
      name: name.trim(),
      description: description?.trim() || ''
    });

    console.log('✅ EXPENSE CATEGORY CREATED:', category.name);
    return successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Category with this name already exists', 400);
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const { id } = req.params;

    if (name !== undefined && !name.trim()) {
      return errorResponse(res, 'Category name cannot be empty', 400);
    }

    const existing = await ExpenseCategory.findAll({ search: name?.trim() });
    const duplicate = existing.find(c => 
      c._id.toString() !== id && 
      c.name.toLowerCase() === name?.trim().toLowerCase()
    );
    if (duplicate) {
      return errorResponse(res, 'Category with this name already exists', 400);
    }

    const category = await ExpenseCategory.update(id, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(status && { status })
    });

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Category with this name already exists', 400);
    }
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inUse = await ExpenseCategory.isInUse(id);
    if (inUse) {
      await ExpenseCategory.update(id, { status: 'inactive' });
      console.log('⚠️ CATEGORY MARKED INACTIVE (in use):', id);
      return successResponse(res, null, 'Category marked as inactive (currently in use)');
    }

    await ExpenseCategory.delete(id);
    console.log('✅ CATEGORY DELETED:', id);
    return successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getActiveCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
