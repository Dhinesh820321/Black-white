/**
 * Migration: Fix customer branchId from invoices
 * 
 * This script updates customers who have invoices but no branchId set.
 * Run: node scripts/fixCustomerBranches.js
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Invoice = mongoose.model('Invoice');
  const Customer = mongoose.model('Customer');

  // Get all customers without branchId
  const customersWithoutBranch = await Customer.find({ branchId: null }).lean();
  console.log(`Found ${customersWithoutBranch.length} customers without branchId`);

  let updated = 0;
  let skipped = 0;

  for (const customer of customersWithoutBranch) {
    // Find latest invoice for this customer
    const latestInvoice = await Invoice.findOne({ customer_id: customer._id })
      .sort({ created_at: -1 })
      .lean();

    if (latestInvoice && latestInvoice.branch_id) {
      await Customer.findByIdAndUpdate(customer._id, {
        branchId: latestInvoice.branch_id
      });
      console.log(`Updated customer ${customer.name} (${customer.phone}) with branch from invoice`);
      updated++;
    } else {
      console.log(`Skipped customer ${customer.name} - no invoices found`);
      skipped++;
    }
  }

  console.log(`\nDone: Updated ${updated}, Skipped ${skipped}`);
  
  // Verify
  const remaining = await Customer.countDocuments({ branchId: null });
  console.log(`Remaining customers without branchId: ${remaining}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});