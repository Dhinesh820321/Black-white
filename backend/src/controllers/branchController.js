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
    const branch = await Branch.create({ 
      name, 
      location, 
      geo_latitude: geo_latitude === '' ? null : Number(geo_latitude) || null, 
      geo_longitude: geo_longitude === '' ? null : Number(geo_longitude) || null, 
      geo_radius: geo_radius === '' ? null : Number(geo_radius) || 100, 
      status 
    });
    return successResponse(res, branch, 'Branch created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const body = { ...req.body };
    
    if (body.geo_latitude !== undefined) {
      body.geo_latitude = body.geo_latitude === '' ? null : Number(body.geo_latitude);
    }
    if (body.geo_longitude !== undefined) {
      body.geo_longitude = body.geo_longitude === '' ? null : Number(body.geo_longitude);
    }
    if (body.geo_radius !== undefined) {
      body.geo_radius = body.geo_radius === '' ? null : Number(body.geo_radius);
    }
    
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
