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
    let { name, location, geo_latitude, geo_longitude, geo_radius, status } = req.body;
    geo_latitude = geo_latitude === '' ? undefined : geo_latitude;
    geo_longitude = geo_longitude === '' ? undefined : geo_longitude;
    geo_radius = geo_radius === '' ? undefined : geo_radius;
    const branch = await Branch.create({ name, location, geo_latitude, geo_longitude, geo_radius, status });
    return successResponse(res, branch, 'Branch created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    let body = { ...req.body };
    if (body.geo_latitude === '') body.geo_latitude = undefined;
    if (body.geo_longitude === '') body.geo_longitude = undefined;
    if (body.geo_radius === '') body.geo_radius = undefined;
    const branch = await Branch.update(req.params.id, body);
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
