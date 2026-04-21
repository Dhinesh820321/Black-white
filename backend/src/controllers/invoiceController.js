const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllInvoices = async (req, res, next) => {
  try {
    let { branch_id, customer_id, employee_id, payment_type, date, start_date, end_date, month, year } = req.query;
    
    branch_id = branch_id || null;
    customer_id = customer_id || null;
    employee_id = employee_id || null;
    payment_type = payment_type || null;
    date = date || null;
    start_date = start_date || null;
    end_date = end_date || null;
    month = month || null;
    year = year || null;

    let invoices = await Invoice.findAll({ branch_id, customer_id, employee_id, payment_type, date, start_date, end_date, month, year });
    invoices = invoices.map(inv => {
      if (inv.branch_id && typeof inv.branch_id === 'object') {
        inv.branch_name = inv.branch_id.name;
        inv.branch_id = inv.branch_id._id || inv.branch_id.id;
      }
      if (inv.customer_id && typeof inv.customer_id === 'object') {
        inv.customer_name = inv.customer_id.name;
        inv.customer_id = inv.customer_id._id || inv.customer_id.id;
      }
      if (inv.employee_id && typeof inv.employee_id === 'object') {
        inv.employee_name = inv.employee_id.name;
        inv.employee_id = inv.employee_id._id || inv.employee_id.id;
      }
      return inv;
    });
    return successResponse(res, invoices);
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }
    return successResponse(res, invoice);
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    console.log('📋 CREATE INVOICE - Request body:', JSON.stringify(req.body, null, 2));

    const { customer_id, mobile, customer_name, total_amount, tax_amount, discount, final_amount, payment_type, notes } = req.body;
    const items = req.body.items || req.body.services;
    
    const employeeId = req.user._id || req.user.id;
    let branchId = req.body.branch_id || req.user.branch_id;
    
    if (typeof branchId === 'object' && branchId !== null) {
      branchId = branchId._id || branchId.id;
    }

    let finalCustomerId = customer_id || null;

    // Calculate invoice amount for loyalty points
    const invoiceAmount = Number(final_amount) || Number(total_amount) || 0;
    const loyaltyPointsEarned = Math.floor(invoiceAmount / 100);

    // Handle customer by mobile
    if (mobile) {
      console.log('📱 Processing customer with mobile:', mobile);
      
      const existingCustomer = await Customer.findByPhone(mobile);
      console.log('📱 Existing Customer:', existingCustomer);

      if (!existingCustomer) {
        // CASE 1: NEW CUSTOMER - Create with visit_count = 0, last_visit = null
        // Add loyalty points for first purchase even though they remain "New"
        console.log('🆕 Creating NEW customer');
        const newCustomer = await Customer.create({
          name: customer_name || 'Walk-in',
          phone: mobile,
          last_visit: null,
          visit_count: 0,
          loyalty_points: loyaltyPointsEarned  // Add points for first purchase
        });
        finalCustomerId = newCustomer.id || newCustomer._id;
        console.log('✅ NEW customer created with ID:', finalCustomerId, '- visit_count: 0, loyalty_points:', loyaltyPointsEarned);
        // ❌ DO NOT update last_visit for first invoice - they remain "New"
      } else {
        // CASE 2: EXISTING CUSTOMER - Increment visit_count, update last_visit, add loyalty points
        console.log('🔄 Updating EXISTING customer - recording visit');
        await Customer.recordVisit(existingCustomer._id, invoiceAmount);
        finalCustomerId = existingCustomer._id;
        console.log('✅ visit_count incremented, last_visit updated, loyalty_points added for customer:', finalCustomerId);
      }
    } else if (customer_id && !mobile) {
      // Handle case where customer_id is passed directly (no mobile lookup)
      const existingCustomer = await Customer.findById(customer_id);
      if (existingCustomer) {
        // Record visit for existing customer
        await Customer.recordVisit(customer_id, invoiceAmount);
        console.log('🔄 Recorded visit for customer:', customer_id, '- loyalty points:', loyaltyPointsEarned);
      }
    }

    console.log('📋 CREATE INVOICE - Parsed:', { 
      user: req.user?.name, 
      employeeId, 
      branchId,
      customer_id: finalCustomerId,
      itemCount: items?.length,
      payment_type,
      total_amount
    });

    if (!branchId) {
      return errorResponse(res, 'Branch ID missing. Please contact admin.', 400);
    }

    if (!items || items.length === 0) {
      return errorResponse(res, 'At least one service item is required', 400);
    }

    if (!payment_type || !['CASH', 'UPI', 'CARD'].includes(payment_type)) {
      return errorResponse(res, 'Valid payment type is required (CASH, UPI, or CARD)', 400);
    }

    const invoice = await Invoice.create({ 
      branch_id: branchId, 
      customer_id: finalCustomerId, 
      employee_id: employeeId, 
      items, 
      total_amount: Number(total_amount) || Number(final_amount) || 0, 
      tax_amount: Number(tax_amount) || 0, 
      discount: Number(discount) || 0, 
      final_amount: Number(final_amount) || Number(total_amount) || 0, 
      payment_type, 
      notes 
    });
    
    console.log('✅ INVOICE CREATED:', invoice.invoice_number);
    return successResponse(res, invoice, 'Invoice created successfully', 201);
  } catch (error) {
    console.error('❌ CREATE INVOICE ERROR:', error.message);
    console.error('❌ Stack:', error.stack);
    next(error);
  }
};

const getDailyRevenue = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const revenue = await Invoice.getDailyRevenue(branch_id, date || new Date().toISOString().split('T')[0]);
    return successResponse(res, revenue);
  } catch (error) {
    next(error);
  }
};

const getMonthlyRevenue = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    const now = new Date();
    const revenue = await Invoice.getMonthlyRevenue(branch_id, year || now.getFullYear(), month || now.getMonth() + 1);
    return successResponse(res, revenue);
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }
    return successResponse(res, invoice, 'Invoice updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllInvoices, getInvoice, createInvoice, getDailyRevenue, getMonthlyRevenue, updateInvoice };
