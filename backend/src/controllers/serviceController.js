const Service = require('../models/Service');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllServices = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const services = await Service.findAll({ status, search });
    return successResponse(res, services);
  } catch (error) {
    next(error);
  }
};

const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return errorResponse(res, 'Service not found', 404);
    }
    return successResponse(res, service);
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, price, gst_percentage, duration_minutes, commission_percentage, status } = req.body;
    const service = await Service.create({ name, price, gst_percentage, duration_minutes, commission_percentage, status });
    return successResponse(res, service, 'Service created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await Service.update(req.params.id, req.body);
    if (!service) {
      return errorResponse(res, 'Service not found', 404);
    }
    return successResponse(res, service, 'Service updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    await Service.delete(req.params.id);
    return successResponse(res, null, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllServices, getService, createService, updateService, deleteService };
