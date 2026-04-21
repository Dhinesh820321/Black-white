const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');
const { successResponse } = require('../utils/responseHelper');

const getDailyReport = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const revenue = await Invoice.getDailyRevenue(branch_id, targetDate);

    let attendance = await Attendance.findAll({ branch_id, date: targetDate });
    attendance = attendance.map(record => {
      if (record.branch_id && typeof record.branch_id === 'object') {
        record.branch_name = record.branch_id.name;
        record.branch_id = record.branch_id._id || record.branch_id.id;
      }
      if (record.employee_id && typeof record.employee_id === 'object') {
        record.employee_name = record.employee_id.name;
        record.employee_id = record.employee_id._id || record.employee_id.id;
      }
      return record;
    });

    const expenseData = await Expense.getSummary(branch_id, targetDate, targetDate);

    let invoices = await Invoice.findAll({ branch_id, date: targetDate });
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

    return successResponse(res, {
      date: targetDate,
      revenue,
      invoices,
      attendance,
      expenses: expenseData.total,
      summary: {
        totalRevenue: revenue.total,
        totalExpenses: expenseData.total,
        netProfit: revenue.total - expenseData.total
      }
    });
  } catch (error) {
    console.error('Daily Report Error:', error);
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const InvoiceModel = mongoose.model('Invoice');
    const ExpenseModel = mongoose.model('Expense');

    const matchFilter = {
      created_at: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      matchFilter.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const summaryStats = await InvoiceModel.aggregate([
      { $match: matchFilter },
      { $group: {
        _id: null,
        revenue: { $sum: '$final_amount' },
        subtotal: { $sum: '$total_amount' },
        tax: { $sum: '$tax_amount' },
        discount: { $sum: '$discount' },
        total_invoices: { $sum: 1 },
        avg_invoice_value: { $avg: '$final_amount' },
        upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
        cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } }
      }}
    ]);

    const summary = summaryStats[0] || { 
      revenue: 0, 
      total_invoices: 0, 
      avg_invoice_value: 0, 
      upi: 0, 
      cash: 0,
      subtotal: 0,
      tax: 0,
      discount: 0
    };

    const expenseMatch = {
      created_at: { $gte: startDate, $lte: endDate }
    };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      expenseMatch.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const expenseStats = await ExpenseModel.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalExpenses = expenseStats[0]?.total || 0;

    const dailyData = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const dayStart = new Date(targetYear, targetMonth - 1, day);
      const dayEnd = new Date(targetYear, targetMonth - 1, day, 23, 59, 59);
      
      const dayMatch = {
        created_at: { $gte: dayStart, $lte: dayEnd },
        status: 'completed'
      };
      if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
        dayMatch.branch_id = new mongoose.Types.ObjectId(branch_id);
      }

      const dayStats = await InvoiceModel.aggregate([
        { $match: dayMatch },
        { $group: { _id: null, revenue: { $sum: '$final_amount' }, invoices: { $sum: 1 } } }
      ]);

      dailyData.push({
        day,
        date: dayStart.toISOString().split('T')[0],
        revenue: dayStats[0]?.revenue || 0,
        invoices: dayStats[0]?.invoices || 0
      });
    }

    console.log('Monthly Report:', { 
      branch: branch_id || 'All', 
      period: `${targetYear}-${targetMonth}`,
      revenue: summary.revenue,
      expenses: totalExpenses,
      invoices: summary.total_invoices
    });

    return successResponse(res, {
      period: { year: targetYear, month: targetMonth, startDate, endDate },
      summary,
      expenses: { total: totalExpenses, count: expenseStats[0]?.count || 0 },
      profit: summary.revenue - totalExpenses,
      dailyData
    });
  } catch (error) {
    console.error('Monthly Report Error:', error);
    next(error);
  }
};

const getBranchPerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    
    const today = new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = end_date 
      ? new Date(end_date) 
      : today;
    endDate.setHours(23, 59, 59, 999);

    const InvoiceModel = mongoose.model('Invoice');
    const ExpenseModel = mongoose.model('Expense');
    const BranchModel = mongoose.model('Branch');

    const branchFilter = {};
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      branchFilter._id = new mongoose.Types.ObjectId(branch_id);
    }
    const branches = await BranchModel.find({ ...branchFilter, status: 'active' }).lean();

    const performanceData = await Promise.all(branches.map(async (branch) => {
      const invoiceMatch = {
        created_at: { $gte: startDate, $lte: endDate },
        status: 'completed',
        branch_id: branch._id
      };

      const invoiceStats = await InvoiceModel.aggregate([
        { $match: invoiceMatch },
        { $group: {
          _id: null,
          revenue: { $sum: '$final_amount' },
          totalInvoices: { $sum: 1 },
          upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
          cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } }
        }}
      ]);

      const expenseMatch = {
        created_at: { $gte: startDate, $lte: endDate },
        branch_id: branch._id
      };

      const expenseStats = await ExpenseModel.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const revenue = invoiceStats[0]?.revenue || 0;
      const expenses = expenseStats[0]?.total || 0;

      return {
        _id: branch._id,
        id: branch._id,
        name: branch.name,
        location: branch.location,
        revenue,
        totalInvoices: invoiceStats[0]?.totalInvoices || 0,
        expenses,
        profit: revenue - expenses,
        profitMargin: revenue > 0 ? parseFloat(((revenue - expenses) / revenue * 100).toFixed(2)) : 0,
        upiCollection: invoiceStats[0]?.upi || 0,
        cashCollection: invoiceStats[0]?.cash || 0
      };
    }));

    console.log('Branch Performance:', { 
      startDate, 
      endDate, 
      branches: performanceData.length,
      totalRevenue: performanceData.reduce((sum, b) => sum + b.revenue, 0)
    });

    return successResponse(res, {
      period: { start_date: startDate.toISOString(), end_date: endDate.toISOString() },
      branches: performanceData,
      totals: {
        revenue: performanceData.reduce((sum, b) => sum + b.revenue, 0),
        expenses: performanceData.reduce((sum, b) => sum + b.expenses, 0),
        invoices: performanceData.reduce((sum, b) => sum + b.totalInvoices, 0)
      }
    });
  } catch (error) {
    console.error('Branch Performance Error:', error);
    next(error);
  }
};

const getEmployeePerformanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    
    const today = new Date();
    const startDate = start_date 
      ? new Date(start_date) 
      : new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = end_date 
      ? new Date(end_date) 
      : today;
    endDate.setHours(23, 59, 59, 999);

    const InvoiceModel = mongoose.model('Invoice');
    const UserModel = mongoose.model('User');

    const employeeFilter = { role: 'employee', status: 'active' };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      employeeFilter.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const employees = await UserModel.find(employeeFilter)
      .populate('branch_id', 'name')
      .lean();

    const performanceData = await Promise.all(employees.map(async (emp) => {
      const invoiceMatch = {
        created_at: { $gte: startDate, $lte: endDate },
        status: 'completed',
        employee_id: emp._id
      };

      const invoiceStats = await InvoiceModel.aggregate([
        { $match: invoiceMatch },
        { $group: {
          _id: null,
          revenue: { $sum: '$final_amount' },
          totalServices: { $sum: 1 }
        }}
      ]);

      const serviceCount = await InvoiceModel.aggregate([
        { $match: invoiceMatch },
        { $unwind: '$items' },
        { $group: { _id: null, count: { $sum: '$items.quantity' } } }
      ]);

      return {
        _id: emp._id,
        id: emp._id,
        name: emp.name,
        phone: emp.phone,
        role: emp.role,
        branch_name: emp.branch_id?.name || 'N/A',
        revenue: invoiceStats[0]?.revenue || 0,
        totalServices: serviceCount[0]?.count || invoiceStats[0]?.totalServices || 0,
        totalInvoices: invoiceStats[0]?.totalServices || 0,
        avgPerService: serviceCount[0]?.count > 0 
          ? parseFloat((invoiceStats[0]?.revenue / serviceCount[0].count).toFixed(2)) 
          : 0
      };
    }));

    const sortedData = performanceData.sort((a, b) => b.revenue - a.revenue);

    console.log('Employee Performance:', { 
      employees: sortedData.length,
      topPerformer: sortedData[0]?.name
    });

    return successResponse(res, {
      period: { start_date: startDate.toISOString(), end_date: endDate.toISOString() },
      employees: sortedData,
      totals: {
        revenue: sortedData.reduce((sum, e) => sum + e.revenue, 0),
        services: sortedData.reduce((sum, e) => sum + e.totalServices, 0)
      }
    });
  } catch (error) {
    console.error('Employee Performance Error:', error);
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    return successResponse(res, { message: 'Export logic ready' });
  } catch (error) {
    next(error);
  }
};

const getDailyCollection = async (req, res, next) => {
  try {
    const { date, branch_id } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const InvoiceModel = mongoose.model('Invoice');
    const ExpenseModel = mongoose.model('Expense');

    const invoiceMatch = {
      created_at: { $gte: start, $lte: end },
      status: 'completed'
    };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      invoiceMatch.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const invoices = await InvoiceModel.find(invoiceMatch)
      .populate('customer_id', 'name')
      .populate('employee_id', 'name')
      .populate('branch_id', 'name')
      .populate('items.service_id', 'name')
      .sort({ created_at: 1 })
      .lean();

    const cashEntries = [];
    const upiEntries = [];
    let totalCash = 0;
    let totalUPI = 0;

    invoices.forEach(inv => {
      const entry = {
        _id: inv._id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_id?.name || 'Walk-in',
        employee_name: inv.employee_id?.name || 'N/A',
        amount: inv.final_amount,
        items: inv.items?.map(i => i.service_id?.name || 'Service').join(', ') || 'Service',
        time: new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        created_at: inv.created_at
      };

      if (inv.payment_type === 'CASH') {
        cashEntries.push(entry);
        totalCash += inv.final_amount;
      } else if (inv.payment_type === 'UPI') {
        upiEntries.push(entry);
        totalUPI += inv.final_amount;
      }
    });

    const expenseMatch = {
      created_at: { $gte: start, $lte: end }
    };
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      expenseMatch.branch_id = new mongoose.Types.ObjectId(branch_id);
    }

    const expenses = await ExpenseModel.find(expenseMatch)
      .populate('employee_id', 'name')
      .sort({ created_at: 1 })
      .lean();

    const expenseEntries = expenses.map(exp => ({
      _id: exp._id,
      title: exp.title,
      amount: exp.amount,
      payment_mode: exp.payment_mode,
      employee_name: exp.employee_id?.name || 'N/A',
      time: new Date(exp.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      created_at: exp.created_at
    }));

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCollection = totalCash + totalUPI;
    const balance = totalCollection - totalExpense;

    let branchName = 'All Branches';
    if (branch_id && mongoose.Types.ObjectId.isValid(branch_id)) {
      const BranchModel = mongoose.model('Branch');
      const branch = await BranchModel.findById(branch_id).lean();
      if (branch) branchName = branch.name;
    }

    console.log('Daily Collection:', { 
      date: targetDate, 
      branch: branchName,
      cash: totalCash,
      upi: totalUPI,
      expenses: totalExpense,
      balance
    });

    return successResponse(res, {
      date: targetDate,
      branch_id,
      branch_name: branchName,
      totalCash,
      totalUPI,
      totalCollection,
      totalExpense,
      balance,
      cashEntries,
      upiEntries,
      expenses: expenseEntries
    });
  } catch (error) {
    console.error('Daily Collection Error:', error);
    next(error);
  }
};

const exportCollectionPDF = async (req, res, next) => {
  try {
    const { date, branch_id, data } = req.body;
    const PDFDocument = require('pdfkit');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=daily-collection-${date}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).fillColor('#1e40af').text('DAILY COLLECTION REPORT', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#4b5563').text('Salon Management System', { align: 'center' });
    doc.moveDown(0.8);

    const formattedDate = new Date(date).toLocaleDateString('en-IN', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
    doc.fontSize(10).fillColor('#374151');
    doc.text(`Date: ${formattedDate}`, { align: 'center' });
    doc.text(`Branch: ${data?.branch_name || 'All Branches'}`, { align: 'center' });
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
    doc.moveDown(0.5);

    doc.fontSize(14).fillColor('#1e40af').text('Summary', { underline: true });
    doc.moveDown(0.5);

    const summaryY = doc.y;
    const col1X = 70;
    const col2X = 280;

    doc.fontSize(11).fillColor('#374151');
    doc.text('Cash Collection:', col1X, summaryY);
    doc.fillColor('#059669').text(`Rs. ${(data?.totalCash || 0).toLocaleString('en-IN')}`, col2X, summaryY);

    doc.fillColor('#374151');
    doc.text('UPI Collection:', col1X, summaryY + 18);
    doc.fillColor('#059669').text(`Rs. ${(data?.totalUPI || 0).toLocaleString('en-IN')}`, col2X, summaryY + 18);

    doc.fillColor('#374151');
    doc.text('Total Collection:', col1X, summaryY + 36);
    doc.fillColor('#059669').text(`Rs. ${(data?.totalCollection || 0).toLocaleString('en-IN')}`, col2X, summaryY + 36);

    doc.fillColor('#374151');
    doc.text('Total Expenses:', col1X, summaryY + 54);
    doc.fillColor('#dc2626').text(`Rs. ${(data?.totalExpense || 0).toLocaleString('en-IN')}`, col2X, summaryY + 54);

    doc.moveDown(3.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
    doc.moveDown(0.5);

    doc.fontSize(14).fillColor('#1e40af').text('Balance', { underline: true });
    doc.moveDown(0.3);

    const balanceColor = (data?.balance || 0) >= 0 ? '#059669' : '#dc2626';
    doc.fontSize(16).fillColor(balanceColor).text(`Rs. ${(data?.balance || 0).toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    if (data?.cashEntries?.length > 0) {
      doc.fontSize(12).fillColor('#1e40af').text('Cash Entries', { underline: true });
      doc.moveDown(0.3);

      data.cashEntries.forEach((entry, idx) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(9).fillColor('#374151');
        doc.text(`${idx + 1}. Rs. ${entry.amount?.toLocaleString('en-IN')} - ${entry.customer_name} (${entry.time})`, 60);
      });
      doc.moveDown(0.5);
    }

    if (data?.upiEntries?.length > 0) {
      doc.fontSize(12).fillColor('#1e40af').text('UPI Entries', { underline: true });
      doc.moveDown(0.3);

      data.upiEntries.forEach((entry, idx) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(9).fillColor('#374151');
        doc.text(`${idx + 1}. Rs. ${entry.amount?.toLocaleString('en-IN')} - ${entry.customer_name} (${entry.time})`, 60);
      });
      doc.moveDown(0.5);
    }

    if (data?.expenses?.length > 0) {
      doc.fontSize(12).fillColor('#1e40af').text('Expenses', { underline: true });
      doc.moveDown(0.3);

      data.expenses.forEach((entry, idx) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(9).fillColor('#374151');
        doc.text(`${idx + 1}. Rs. ${entry.amount?.toLocaleString('en-IN')} - ${entry.title} (${entry.time})`, 60);
      });
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#9ca3af').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.text('Salon Management System', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Collection PDF Export Error:', error);
    next(error);
  }
};

module.exports = { 
  getDailyReport, 
  getMonthlyReport, 
  getBranchPerformanceReport, 
  getEmployeePerformanceReport, 
  exportReport,
  getDailyCollection,
  exportCollectionPDF
};
