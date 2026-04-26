const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rs. 0.00';
  return `Rs. ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getMonthName = (month, year) => {
  const date = new Date(year, month - 1);
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const getDailyReportData = async (branchId, date) => {
  const InvoiceModel = mongoose.model('Invoice');
  const ExpenseModel = mongoose.model('Expense');

  const targetDate = date || new Date().toISOString().split('T')[0];
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const matchFilter = {
    created_at: { $gte: start, $lte: end },
    status: 'completed'
  };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    matchFilter.branch_id = new mongoose.Types.ObjectId(branchId);
  }

  const revenueStats = await InvoiceModel.aggregate([
    { $match: matchFilter },
    { $group: {
      _id: null,
      revenue: { $sum: '$final_amount' },
      count: { $sum: 1 },
      upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
      cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } }
    }}
  ]);

  const invoices = await InvoiceModel.find(matchFilter)
    .populate('employee_id', 'name')
    .populate('customer_id', 'name')
    .populate('branch_id', 'name')
    .populate('items.service_id', 'name')
    .sort({ created_at: -1 })
    .lean();

  const expenseMatch = {
    created_at: { $gte: start, $lte: end }
  };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    expenseMatch.branch_id = new mongoose.Types.ObjectId(branchId);
  }

  const expenseStats = await ExpenseModel.aggregate([
    { $match: expenseMatch },
    { $group: { _id: null, total: { $sum: '$grand_total' }, count: { $sum: 1 } } }
  ]);

  let branchName = 'All Branches';
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    const BranchModel = mongoose.model('Branch');
    const branch = await BranchModel.findById(branchId).lean();
    if (branch) branchName = branch.name;
  }

  return {
    date: targetDate,
    branchName,
    revenue: revenueStats[0]?.revenue || 0,
    invoiceCount: revenueStats[0]?.count || 0,
    upiCollection: revenueStats[0]?.upi || 0,
    cashCollection: revenueStats[0]?.cash || 0,
    expenses: expenseStats[0]?.total || 0,
    expenseCount: expenseStats[0]?.count || 0,
    profit: (revenueStats[0]?.revenue || 0) - (expenseStats[0]?.total || 0),
    invoices: invoices.map(inv => ({
      invoice_number: inv.invoice_number,
      customer_name: inv.customer_id?.name || 'Walk-in',
      employee_name: inv.employee_id?.name || 'N/A',
      services: inv.items?.map(item => item.service_id?.name || item.name || 'Service').join(', ') || 'No Service',
      amount: inv.final_amount,
      payment_type: inv.payment_type,
      time: new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }))
  };
};

const getMonthlyReportData = async (branchId, year, month) => {
  const InvoiceModel = mongoose.model('Invoice');
  const ExpenseModel = mongoose.model('Expense');

  const targetYear = parseInt(year) || new Date().getFullYear();
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const matchFilter = {
    created_at: { $gte: startDate, $lte: endDate },
    status: 'completed'
  };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    matchFilter.branch_id = new mongoose.Types.ObjectId(branchId);
  }

  const revenueStats = await InvoiceModel.aggregate([
    { $match: matchFilter },
    { $group: {
      _id: null,
      revenue: { $sum: '$final_amount' },
      count: { $sum: 1 },
      upi: { $sum: { $cond: [{ $eq: ['$payment_type', 'UPI'] }, '$final_amount', 0] } },
      cash: { $sum: { $cond: [{ $eq: ['$payment_type', 'CASH'] }, '$final_amount', 0] } }
    }}
  ]);

  const dailyData = await InvoiceModel.aggregate([
    { $match: matchFilter },
    { $group: {
      _id: { $dayOfMonth: '$created_at' },
      revenue: { $sum: '$final_amount' },
      invoices: { $sum: 1 }
    }},
    { $sort: { _id: 1 } },
    { $project: { day: '$_id', revenue: 1, invoices: 1, _id: 0 } }
  ]);

  const expenseMatch = {
    created_at: { $gte: startDate, $lte: endDate }
  };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    expenseMatch.branch_id = new mongoose.Types.ObjectId(branchId);
  }

  const expenseStats = await ExpenseModel.aggregate([
    { $match: expenseMatch },
    { $group: { _id: null, total: { $sum: '$grand_total' }, count: { $sum: 1 } } }
  ]);

  const profit = (revenueStats[0]?.revenue || 0) - (expenseStats[0]?.total || 0);

  let branchName = 'All Branches';
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    const BranchModel = mongoose.model('Branch');
    const branch = await BranchModel.findById(branchId).lean();
    if (branch) branchName = branch.name;
  }

  return {
    month: getMonthName(targetMonth, targetYear),
    branchName,
    revenue: revenueStats[0]?.revenue || 0,
    invoiceCount: revenueStats[0]?.count || 0,
    upiCollection: revenueStats[0]?.upi || 0,
    cashCollection: revenueStats[0]?.cash || 0,
    expenses: expenseStats[0]?.total || 0,
    expenseCount: expenseStats[0]?.count || 0,
    profit: profit,
    dailyData,
    daysInMonth: endDate.getDate()
  };
};

const exportDailyPDF = async (res, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=daily-report-${data.date}.pdf`);

      doc.pipe(res);

      doc.fontSize(20).fillColor('#1e40af').text('DAILY REPORT', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#4b5563').text('Salon Management System', { align: 'center' });
      doc.moveDown(0.8);

      doc.fillColor('#374151').fontSize(10);
      doc.text(`Date: ${formatDate(data.date)}`, { align: 'center' });
      doc.text(`Branch: ${data.branchName}`, { align: 'center' });
      doc.moveDown(1);

      doc.fillColor('#000000');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor('#1e40af').text('Summary', { underline: true });
      doc.moveDown(0.5);

      const summaryY = doc.y;
      const col1X = 70;
      const col2X = 280;

      doc.fontSize(11).fillColor('#374151');
      doc.text('Total Revenue:', col1X, summaryY);
      doc.fillColor('#059669').text(formatCurrency(data.revenue), col2X, summaryY);

      doc.fillColor('#374151');
      doc.text('Total Invoices:', col1X, summaryY + 18);
      doc.fillColor('#1e40af').text(data.invoiceCount.toString(), col2X, summaryY + 18);

      doc.fillColor('#374151');
      doc.text('UPI Collection:', col1X, summaryY + 36);
      doc.text(formatCurrency(data.upiCollection), col2X, summaryY + 36);

      doc.fillColor('#374151');
      doc.text('Cash Collection:', col1X, summaryY + 54);
      doc.text(formatCurrency(data.cashCollection), col2X, summaryY + 54);

      doc.fillColor('#374151');
      doc.text('Total Expenses:', col1X, summaryY + 72);
      doc.fillColor('#dc2626').text(formatCurrency(data.expenses), col2X, summaryY + 72);

      doc.moveDown(3.5);

      doc.fillColor('#000000');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor('#1e40af').text('Net Profit', { underline: true });
      doc.moveDown(0.3);

      const profitColor = data.profit >= 0 ? '#059669' : '#dc2626';
      doc.fontSize(16).fillColor(profitColor).text(formatCurrency(data.profit), { align: 'center' });
      doc.moveDown(1);

      if (data.invoices && data.invoices.length > 0) {
        doc.fontSize(14).fillColor('#1e40af').text('Transactions', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const tableHeaders = ['#', 'Service', 'Customer', 'Employee', 'Amount', 'Mode'];
        const columnWidths = [20, 140, 90, 80, 70, 45];
        const rowHeight = 20;

        doc.fontSize(9).fillColor('#6b7280');
        let xPos = 50;
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, tableTop, { width: columnWidths[i], align: 'left' });
          xPos += columnWidths[i];
        });

        doc.moveTo(50, tableTop + rowHeight - 5).lineTo(545, tableTop + rowHeight - 5).stroke('#e5e7eb');
        doc.moveDown(0.5);

        doc.fillColor('#374151');
        data.invoices.slice(0, 30).forEach((inv, idx) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          const y = tableTop + rowHeight + (idx * rowHeight);
          xPos = 50;
          doc.text((idx + 1).toString(), xPos, y, { width: columnWidths[0] });
          xPos += columnWidths[0];
          doc.text((inv.services || 'No Service').substring(0, 25), xPos, y, { width: columnWidths[1] });
          xPos += columnWidths[1];
          doc.text((inv.customer_name || 'Walk-in').substring(0, 15), xPos, y, { width: columnWidths[2] });
          xPos += columnWidths[2];
          doc.text((inv.employee_name || 'N/A').substring(0, 12), xPos, y, { width: columnWidths[3] });
          xPos += columnWidths[3];
          doc.text(formatCurrency(inv.amount), xPos, y, { width: columnWidths[4] });
          xPos += columnWidths[4];
          doc.text(inv.payment_type || '', xPos, y, { width: columnWidths[5] });
        });
        
        if (data.invoices.length > 0) {
          const totalCash = data.invoices.filter(i => i.payment_type === 'CASH').reduce((sum, i) => sum + (i.amount || 0), 0);
          const totalUPI = data.invoices.filter(i => i.payment_type === 'UPI').reduce((sum, i) => sum + (i.amount || 0), 0);
          const grandTotal = totalCash + totalUPI;
          
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
          doc.moveDown(0.5);

          doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
          doc.text('Total Cash:', 200, doc.y);
          doc.text(formatCurrency(totalCash), 350, doc.y - 12);
          doc.text('Total UPI:', 200, doc.y);
          doc.text(formatCurrency(totalUPI), 350, doc.y - 12);
          doc.text('Grand Total:', 200, doc.y);
          doc.fillColor('#059669').text(formatCurrency(grandTotal), 350, doc.y - 12);
          doc.font('Helvetica');
        }
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#9ca3af').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.text('Salon Management System - Admin Panel', { align: 'center' });

      doc.end();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const exportMonthlyPDF = async (res, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${data.month.replace(' ', '-')}.pdf`);

      doc.pipe(res);

      doc.fontSize(20).fillColor('#1e40af').text('MONTHLY REPORT', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#4b5563').text('Salon Management System', { align: 'center' });
      doc.moveDown(0.8);

      doc.fontSize(10).fillColor('#374151');
      doc.text(`Period: ${data.month}`, { align: 'center' });
      doc.text(`Branch: ${data.branchName}`, { align: 'center' });
      doc.moveDown(1);

      doc.fillColor('#000000');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor('#1e40af').text('Monthly Summary', { underline: true });
      doc.moveDown(0.5);

      const summaryY = doc.y;
      const col1X = 70;
      const col2X = 280;

      doc.fontSize(11).fillColor('#374151');
      doc.text('Monthly Revenue:', col1X, summaryY);
      doc.fillColor('#059669').text(formatCurrency(data.revenue), col2X, summaryY);

      doc.fillColor('#374151');
      doc.text('Total Invoices:', col1X, summaryY + 18);
      doc.fillColor('#1e40af').text(data.invoiceCount.toString(), col2X, summaryY + 18);

      doc.fillColor('#374151');
      doc.text('UPI Collection:', col1X, summaryY + 36);
      doc.text(formatCurrency(data.upiCollection), col2X, summaryY + 36);

      doc.fillColor('#374151');
      doc.text('Cash Collection:', col1X, summaryY + 54);
      doc.text(formatCurrency(data.cashCollection), col2X, summaryY + 54);

      doc.fillColor('#374151');
      doc.text('Total Expenses:', col1X, summaryY + 72);
      doc.fillColor('#dc2626').text(formatCurrency(data.expenses), col2X, summaryY + 72);

      doc.moveDown(4);

      doc.fillColor('#000000');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor('#1e40af').text('Net Profit', { underline: true });
      doc.moveDown(0.3);

      const profitColor = data.profit >= 0 ? '#059669' : '#dc2626';
      doc.fontSize(16).fillColor(profitColor).text(formatCurrency(data.profit), { align: 'center' });
      doc.moveDown(1);

      if (data.dailyData && data.dailyData.length > 0) {
        doc.fontSize(14).fillColor('#1e40af').text('Daily Breakdown', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const tableHeaders = ['Day', 'Revenue', 'Invoices'];
        const columnWidths = [50, 120, 80];
        const rowHeight = 16;

        doc.fontSize(9).fillColor('#6b7280');
        let xPos = 50;
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, tableTop, { width: columnWidths[i], align: 'left' });
          xPos += columnWidths[i];
        });

        doc.moveTo(50, tableTop + rowHeight - 5).lineTo(545, tableTop + rowHeight - 5).stroke('#e5e7eb');

        doc.fillColor('#374151');
        data.dailyData.forEach((day, idx) => {
          if (doc.y > 720) {
            doc.addPage();
          }
          const y = tableTop + rowHeight + (idx * rowHeight);
          xPos = 50;
          doc.text(day.day.toString(), xPos, y, { width: columnWidths[0] });
          xPos += columnWidths[0];
          doc.text(formatCurrency(day.revenue), xPos, y, { width: columnWidths[1] });
          xPos += columnWidths[1];
          doc.text(day.invoices.toString(), xPos, y, { width: columnWidths[2] });
        });
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#9ca3af').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.text('Salon Management System - Admin Panel', { align: 'center' });

      doc.end();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const exportReportPDF = async (req, res, next) => {
  try {
    const { type, date, month, year, branchId } = req.body;

    console.log('PDF Export Request:', { type, date, month, year, branchId });

    if (type === 'daily') {
      const data = await getDailyReportData(branchId, date);
      await exportDailyPDF(res, data);
    } else if (type === 'monthly') {
      const data = await getMonthlyReportData(branchId, year, month);
      await exportMonthlyPDF(res, data);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
  } catch (error) {
    console.error('PDF Export Error:', error);
    next(error);
  }
};

module.exports = { exportReportPDF };
