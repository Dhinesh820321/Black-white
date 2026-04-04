const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllEmployees = async (req, res, next) => {
  try {
    const { branch_id, status, search } = req.query;
    let employees = await User.findAll({ branch_id, role: 'employee', status, search });
    employees = employees.map(e => {
      e.password = undefined;
      e.salary = e.salary ?? 0;
      if (e.branch_id && typeof e.branch_id === 'object') {
        e.branch_name = e.branch_id.name;
        e.branch_id = e.branch_id._id || e.branch_id.id;
      }
      return e;
    });
    console.log('Employees API response:', employees.map(e => ({ name: e.name, salary: e.salary })));
    return successResponse(res, employees);
  } catch (error) {
    console.error("EMPLOYEES ERROR:", error);
    next(error);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
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
    console.log('📝 POST /employees - Request body:', req.body);
    const { name, phone, password, branch_id, salary, geo_lat, geo_long, geo_radius, status } = req.body;
    
    const processedBranchId = branch_id === '' || branch_id === undefined ? null : branch_id;
    
    const employee = await User.create({ 
      name, 
      phone, 
      password, 
      role: 'employee',
      branch_id: processedBranchId, 
      salary: Number(salary) || 0,
      geo_lat,
      geo_long,
      geo_radius: geo_radius || 100,
      status: status || 'active'
    });
    
    employee.password = undefined;
    console.log('✅ Employee created:', employee);
    return successResponse(res, employee, 'Employee created successfully', 201);
  } catch (error) {
    console.error('❌ Error creating employee:', error.message);
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    console.log(`📝 PUT /employees/${req.params.id} - Request body:`, req.body);
    const { password, ...updateData } = req.body;
    const employee = await User.update(req.params.id, updateData);
    if (!employee) {
      console.log('⚠️ Employee not found:', req.params.id);
      return errorResponse(res, 'Employee not found', 404);
    }
    employee.password = undefined;
    employee.salary = employee.salary ?? 0;
    console.log('✅ Employee updated:', employee);
    return successResponse(res, employee, 'Employee updated successfully');
  } catch (error) {
    console.error('❌ Error updating employee:', error.message);
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await User.delete(req.params.id);
    return successResponse(res, null, 'Employee deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeeByPhone = async (req, res, next) => {
  try {
    const employee = await User.findByPhone(req.params.phone);
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }
    employee.password = undefined;
    return successResponse(res, employee);
  } catch (error) {
    next(error);
  }
};

const deleteEmployeeByPhone = async (req, res, next) => {
  try {
    const employee = await User.findByPhone(req.params.phone);
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }
    await User.delete(employee._id);
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
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 'Employee not found', 404);
    }
    return successResponse(res, {
      services: 0,
      revenue: 0,
      attendance: { days_worked: 0, total_hours: 0 }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getEmployeeByPhone, deleteEmployeeByPhone, getEmployeePerformance };
