require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const resetAdmin = async () => {
  let connection;
  try {
    console.log('🔄 Admin Reset Script Starting...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salon_management',
      connectTimeout: 10000
    });
    console.log('✅ Connected to database');

    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log('🔐 Generated password hash:', hashedPassword.substring(0, 30) + '...');

    const [branches] = await connection.query('SELECT id, name FROM branches LIMIT 1');
    const branchId = branches.length > 0 ? branches[0].id : null;
    console.log('📍 Default branch ID:', branchId);

    const [existing] = await connection.query('SELECT id, name, phone, role, status FROM employees WHERE role = ?', ['admin']);
    
    if (existing.length > 0) {
      console.log('\n📋 Existing admin(s) found:');
      existing.forEach(a => {
        console.log(`   - ID: ${a.id}, Name: ${a.name}, Phone: ${a.phone}, Status: ${a.status}`);
      });
      
      console.log('\n🔄 Updating existing admin...');
      await connection.query(
        `UPDATE employees SET password = ?, status = 'active' WHERE role = 'admin'`,
        [hashedPassword]
      );
      console.log('✅ Admin password updated');
    } else {
      console.log('\n❌ No admin found. Creating new admin...');
      
      await connection.query(
        `INSERT INTO employees (name, role, phone, password, branch_id, salary, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Super Admin', 'admin', '9999999999', hashedPassword, branchId, 0, 'active']
      );
      console.log('✅ New admin created');
    }

    const [verify] = await connection.query(
      'SELECT id, name, phone, role, status FROM employees WHERE role = ?',
      ['admin']
    );

    console.log('\n📋 Admin Account Details:');
    console.log('   Phone: 9999999999');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('   Status:', verify[0]?.status || 'N/A');

    console.log('\n✅ Admin verification complete!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('   Phone: 9999999999');
    console.log('   Password: admin123');
    console.log('\n⚠️  NOTE: This system uses PHONE number, not email!');
    console.log('   Do NOT use admin@gmail.com - use 9999999999 instead.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure MySQL is running');
    console.error('   2. Check .env file database settings');
    console.error('   3. Run: node src/config/schema.js to initialize database');
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed');
  }
};

resetAdmin();
