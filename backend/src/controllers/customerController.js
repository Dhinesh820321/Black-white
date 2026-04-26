const Customer = require('../models/Customer');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllCustomers = async (req, res, next) => {
  try {
    const { search, retention_alert, branchId } = req.query;
    const customers = await Customer.findAll({ search, retention_alert, branchId });
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
    console.log('📝 POST /customers - Request body:', req.body);
    const { name, phone, email, notes, branch_id } = req.body;
    
    // Use branch_id from request body or from logged-in user
    const customerBranchId = branch_id || req.user?.branch_id;
    
    // Create the customer first
    const customer = await Customer.create({ 
      name: (name || 'Walk-in').trim(), 
      phone: phone?.trim(), 
      email: email?.trim(), 
      notes: notes?.trim(),
      branchId: customerBranchId
    });
    
    // Fetch the created customer with branch populated
    const CustomerModel = require('../models/Customer');
    const populatedCustomer = await CustomerModel.findById(customer._id)
      .populate('branchId', 'name')
      .lean();
    
    // Map branch_name for response
    if (populatedCustomer) {
      populatedCustomer.branch_name = populatedCustomer.branchId?.name || null;
      populatedCustomer.branch_id = populatedCustomer.branchId?._id || null;
    }
    
    console.log('✅ Customer created:', populatedCustomer);
    return successResponse(res, populatedCustomer, 'Customer created successfully', 201);
  } catch (error) {
    console.error('❌ Error creating customer:', error.message);
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    console.log(`📝 PUT /customers/${req.params.id} - Request body:`, req.body);
    const customer = await Customer.update(req.params.id, req.body);
    if (!customer) {
      console.log('⚠️ Customer not found:', req.params.id);
      return errorResponse(res, 'Customer not found', 404);
    }
    
    // Fetch updated customer with branch populated
    const CustomerModel = require('../models/Customer');
    const populatedCustomer = await CustomerModel.findById(req.params.id)
      .populate('branchId', 'name')
      .lean();
    
    // Map branch_name for response
    if (populatedCustomer) {
      populatedCustomer.branch_name = populatedCustomer.branchId?.name || null;
      populatedCustomer.branch_id = populatedCustomer.branchId?._id || null;
    }
    
    console.log('✅ Customer updated:', populatedCustomer);
    return successResponse(res, populatedCustomer, 'Customer updated successfully');
  } catch (error) {
    console.error('❌ Error updating customer:', error.message);
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

const searchByMobile = async (req, res, next) => {
  try {
    const { phone } = req.params;
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return errorResponse(res, 'Valid 10-digit phone number required', 400);
    }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    const customer = await Customer.findByPhone(cleaned);
    if (!customer) {
      return successResponse(res, null, 'Customer not found');
    }
    return successResponse(res, customer);
  } catch (error) {
    next(error);
  }
};

const findOrCreate = async (req, res, next) => {
  try {
    const { name, phone, branch_id } = req.body;
    if (!phone) {
      return errorResponse(res, 'Phone number is required', 400);
    }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    let customer = await Customer.findByPhone(cleaned);
    if (customer) {
      // Update branch if not set
      if (!customer.branchId && (branch_id || req.user?.branch_id)) {
        customer = await Customer.findByIdAndUpdate(customer._id, {
          branchId: branch_id || req.user?.branch_id
        }, { new: true }).lean();
      }
      // Add branch_name
      if (customer?.branchId) {
        const branch = await mongoose.model('Branch').findById(customer.branchId).lean();
        customer.branch_name = branch?.name || null;
      }
      return successResponse(res, customer, 'Existing customer found');
    }
    // Use branch_id from request or from logged-in user
    const customerBranchId = branch_id || req.user?.branch_id;
    customer = await Customer.create({
      name: (name || 'Walk-in').trim(),
      phone: cleaned,
      branchId: customerBranchId
    });
    
    // Fetch with branch populated to get branch_name
    if (customerBranchId) {
      const populatedCustomer = await Customer.findById(customer._id)
        .populate('branchId', 'name')
        .lean();
      if (populatedCustomer) {
        customer.branch_name = populatedCustomer.branchId?.name || null;
        customer.branch_id = populatedCustomer.branchId?._id || null;
      }
    }
    
    return successResponse(res, customer, 'New customer created', 201);
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Customer.findByPhone(req.body.phone?.replace(/\D/g, '').slice(-10));
      return successResponse(res, existing, 'Existing customer found');
    }
    next(error);
  }
};

module.exports = { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getVisitHistory, getRetentionAlerts, searchByMobile, findOrCreate };
