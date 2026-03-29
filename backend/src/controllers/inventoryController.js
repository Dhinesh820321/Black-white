const Inventory = require('../models/Inventory');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllInventory = async (req, res, next) => {
  try {
    const { branch_id, category, low_stock, search } = req.query;
    let inventory = await Inventory.findAll({ branch_id, category, low_stock, search });
    inventory = inventory.map(item => {
      if (item.branch_id && typeof item.branch_id === 'object') {
        item.branch_name = item.branch_id.name;
        item.branch_id = item.branch_id._id || item.branch_id.id;
      }
      return item;
    });
    return successResponse(res, inventory);
  } catch (error) {
    next(error);
  }
};

const getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return errorResponse(res, 'Item not found', 404);
    }
    return successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

const createInventoryItem = async (req, res, next) => {
  try {
    const { branch_id, item_name, category, total_quantity, unit, min_stock_level, cost_per_unit } = req.body;
    const item = await Inventory.create({ branch_id, item_name, category, total_quantity, unit, min_stock_level, cost_per_unit });
    return successResponse(res, item, 'Item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.update(req.params.id, req.body);
    if (!item) {
      return errorResponse(res, 'Item not found', 404);
    }
    return successResponse(res, item, 'Item updated successfully');
  } catch (error) {
    next(error);
  }
};

const useInventory = async (req, res, next) => {
  try {
    const { inventory_id, quantity, service_id } = req.body;
    const item = await Inventory.useInventory(inventory_id, quantity, req.user.id, service_id);
    return successResponse(res, item, 'Inventory updated successfully');
  } catch (error) {
    if (error.message === 'Insufficient inventory') {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    await Inventory.delete(req.params.id);
    return successResponse(res, null, 'Item deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getLowStockAlerts = async (req, res, next) => {
  try {
    const { branch_id } = req.query;
    const alerts = await Inventory.getLowStockAlerts(branch_id);
    return successResponse(res, alerts);
  } catch (error) {
    next(error);
  }
};

const getUsageReport = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const report = await Inventory.getUsageReport(branch_id, start_date, end_date);
    return successResponse(res, report);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllInventory, getInventoryItem, createInventoryItem, updateInventoryItem, useInventory, deleteInventoryItem, getLowStockAlerts, getUsageReport };
