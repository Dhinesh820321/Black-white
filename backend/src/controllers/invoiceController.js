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
      // Map service names from items
      if (inv.items && Array.isArray(inv.items)) {
        inv.services = inv.items.map(item => item.service_id?.name || item.name || 'Service').join(', ');
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

    const { customer_id, mobile, customer_name, tax_amount, discount, payment_type, notes } = req.body;
    const rawItems = req.body.items || req.body.services;
    
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return errorResponse(res, 'At least one service item is required', 400);
    }

    const employeeId = req.user._id || req.user.id;
    let branchId = req.body.branch_id || req.user.branch_id;
    
    if (typeof branchId === 'object' && branchId !== null) {
      branchId = branchId._id || branchId.id;
    }

    if (!branchId) {
      return errorResponse(res, 'Branch ID missing. Please contact admin.', 400);
    }

    if (!payment_type || !['CASH', 'UPI', 'CARD'].includes(payment_type)) {
      return errorResponse(res, 'Valid payment type is required (CASH, UPI, or CARD)', 400);
    }

    // Normalize items to ensure they have service_id and quantity
    const normalizedItems = rawItems.map(item => {
      const service_id = item.service_id || item.id || item.service;
      if (!service_id) {
        throw new Error('Each item must have a valid service_id');
      }
      return {
        service_id,
        quantity: Number(item.quantity) || 1
      };
    });

    // Fetch actual prices from DB to calculate totals on the server (prevent client price manipulation)
    const ServiceModel = mongoose.model('Service');
    const serviceIds = normalizedItems.map(item => item.service_id);
    const dbServices = await ServiceModel.find({ _id: { $in: serviceIds } }).lean();

    let calculatedTotalAmount = 0;
    const processedItems = normalizedItems.map(item => {
      const dbService = dbServices.find(s => s._id.toString() === item.service_id.toString());
      if (!dbService) {
        throw new Error(`Service not found: ${item.service_id}`);
      }
      
      const price = dbService.price || 0;
      const qty = Number(item.quantity) || 1;
      const gstPercent = dbService.gst_percentage !== undefined ? dbService.gst_percentage : 0;
      const subtotal = price * qty;
      calculatedTotalAmount += subtotal;

      return {
        service_id: item.service_id,
        quantity: qty,
        price: price,
        gst_percentage: gstPercent,
        subtotal: subtotal
      };
    });

    const parsedDiscount = Number(discount) || 0;
    const parsedTaxAmount = Number(tax_amount) || 0;
    const calculatedFinalAmount = Math.max(0, calculatedTotalAmount + parsedTaxAmount - parsedDiscount);

    let finalCustomerId = customer_id || null;

    // Calculate loyalty points using server-side calculated final amount
    const loyaltyPointsEarned = Math.floor(calculatedFinalAmount / 100);

    // Handle customer by mobile
    if (mobile) {
      console.log('📱 Processing customer with mobile:', mobile);
      
      const existingCustomer = await Customer.findByPhone(mobile);
      console.log('📱 Existing Customer:', existingCustomer);

      if (!existingCustomer) {
        // CASE 1: NEW CUSTOMER - Create with visit_count = 0, last_visit = null
        console.log('🆕 Creating NEW customer');
        const newCustomer = await Customer.create({
          name: customer_name || 'Walk-in',
          phone: mobile,
          last_visit: null,
          visit_count: 0,
          loyalty_points: loyaltyPointsEarned
        });
        finalCustomerId = newCustomer.id || newCustomer._id;
        console.log('✅ NEW customer created with ID:', finalCustomerId, '- visit_count: 0, loyalty_points:', loyaltyPointsEarned);
      } else {
        // CASE 2: EXISTING CUSTOMER - Increment visit_count, update last_visit, add loyalty points
        console.log('🔄 Updating EXISTING customer - recording visit');
        await Customer.recordVisit(existingCustomer._id, calculatedFinalAmount);
        finalCustomerId = existingCustomer._id;
        console.log('✅ visit_count incremented, last_visit updated, loyalty_points added for customer:', finalCustomerId);
      }
    } else if (customer_id && !mobile) {
      const existingCustomer = await Customer.findById(customer_id);
      if (existingCustomer) {
        await Customer.recordVisit(customer_id, calculatedFinalAmount);
        console.log('🔄 Recorded visit for customer:', customer_id, '- loyalty points:', loyaltyPointsEarned);
      }
    }

    console.log('📋 CREATE INVOICE - Parsed:', { 
      user: req.user?.name, 
      employeeId, 
      branchId,
      customer_id: finalCustomerId,
      itemCount: processedItems.length,
      payment_type,
      total_amount: calculatedTotalAmount,
      final_amount: calculatedFinalAmount
    });

    const invoice = await Invoice.create({ 
      branch_id: branchId, 
      customer_id: finalCustomerId, 
      employee_id: employeeId, 
      items: processedItems, 
      total_amount: calculatedTotalAmount, 
      tax_amount: parsedTaxAmount, 
      discount: parsedDiscount, 
      final_amount: calculatedFinalAmount, 
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
