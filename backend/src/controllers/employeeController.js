const Employee = require('../models/Employee');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllEmployees = async (req, res, next) => {
  try {
    const { branch_id, role, status, search } = req.query;
    const employees = await Employee.findAll({ branch_id, role, status, search });
    employees.forEach(e => e.password = undefined);
    return successResponse(res, employees);
  } catch (error) {
    next(error);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }
    employee.password = undefined;
    return successResponse(res, employee);
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, role, phone, password, branch_id, salary } = req.body;
    const employee = await Employee.create({ name, role, phone, password, branch_id, salary });
    return successResponse(res, employee, 'Employee created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.update(req.params.id, req.body);
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }
    employee.password = undefined;
    return successResponse(res, employee, 'Employee updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await Employee.delete(req.params.id);
    return successResponse(res, null, 'Employee deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeePerformance = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const performance = await Employee.getPerformance(req.params.id, startDate, endDate);
    return successResponse(res, performance);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getEmployeePerformance };
