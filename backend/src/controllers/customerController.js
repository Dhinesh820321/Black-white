const Customer = require('../models/Customer');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllCustomers = async (req, res, next) => {
  try {
    const { search, retention_alert } = req.query;
    const customers = await Customer.findAll({ search, retention_alert });
    return successResponse(res, customers);
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }
    return successResponse(res, customer);
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, notes } = req.body;
    const customer = await Customer.create({ name, phone, email, notes });
    return successResponse(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.update(req.params.id, req.body);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }
    return successResponse(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    await Customer.delete(req.params.id);
    return successResponse(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getVisitHistory = async (req, res, next) => {
  try {
    const history = await Customer.getVisitHistory(req.params.id);
    return successResponse(res, history);
  } catch (error) {
    next(error);
  }
};

const getRetentionAlerts = async (req, res, next) => {
  try {
    const { branch_id } = req.query;
    const alerts = await Customer.getRetentionAlerts(branch_id);
    return successResponse(res, alerts);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getVisitHistory, getRetentionAlerts };
