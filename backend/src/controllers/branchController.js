const Branch = require('../models/Branch');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

const getAllBranches = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const branches = await Branch.findAll({ status, search });
    return successResponse(res, branches);
  } catch (error) {
    next(error);
  }
};

const getBranch = async (req, res, next) => {
  try {
    const branch = await Branch.getWithStats(req.params.id);
    if (!branch) {
      return errorResponse(res, 'Branch not found', 404);
    }
    return successResponse(res, branch);
  } catch (error) {
    next(error);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const { name, location, geo_latitude, geo_longitude, geo_radius, status } = req.body;
    const branch = await Branch.create({ name, location, geo_latitude, geo_longitude, geo_radius, status });
    return successResponse(res, branch, 'Branch created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.update(req.params.id, req.body);
    if (!branch) {
      return errorResponse(res, 'Branch not found', 404);
    }
    return successResponse(res, branch, 'Branch updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    await Branch.delete(req.params.id);
    return successResponse(res, null, 'Branch deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllBranches, getBranch, createBranch, updateBranch, deleteBranch };
