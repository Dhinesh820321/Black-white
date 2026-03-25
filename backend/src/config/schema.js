const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
      connectTimeout: 10000
    });
  } catch (error) {
    console.error('❌ Failed to connect to MySQL. Please ensure MySQL is running.');
    console.error('   Check your .env file and verify DB_HOST, DB_USER, DB_PASSWORD');
    process.exit(1);
    return;
  }

  const dbName = process.env.DB_NAME || 'salon_management';
  
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const schema = `
    CREATE DATABASE IF NOT EXISTS ${dbName};
    USE ${dbName};

    CREATE TABLE IF NOT EXISTS branches (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      manager_id INT,
      geo_latitude DECIMAL(10, 8),
      geo_longitude DECIMAL(11, 8),
      geo_radius INT DEFAULT 100,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      role ENUM('admin', 'manager', 'stylist', 'helper') NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      branch_id INT,
      salary DECIMAL(10, 2) DEFAULT 0,
      status ENUM('active', 'inactive') DEFAULT 'active',
      device_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INT PRIMARY KEY AUTO_INCREMENT,
      employee_id INT NOT NULL,
      branch_id INT NOT NULL,
      check_in_time TIMESTAMP NULL,
      check_out_time TIMESTAMP NULL,
      check_in_lat DECIMAL(10, 8),
      check_in_lng DECIMAL(11, 8),
      check_out_lat DECIMAL(10, 8),
      check_out_lng DECIMAL(11, 8),
      working_hours DECIMAL(5, 2) DEFAULT 0,
      status ENUM('checked_in', 'checked_out', 'active') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      gst_percentage DECIMAL(5, 2) DEFAULT 18.00,
      duration_minutes INT DEFAULT 30,
      commission_percentage DECIMAL(5, 2) DEFAULT 0,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(100),
      last_visit DATE,
      loyalty_points INT DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INT PRIMARY KEY AUTO_INCREMENT,
      branch_id INT NOT NULL,
      customer_id INT,
      employee_id INT NOT NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      total_amount DECIMAL(10, 2) DEFAULT 0,
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      discount DECIMAL(10, 2) DEFAULT 0,
      final_amount DECIMAL(10, 2) DEFAULT 0,
      payment_type ENUM('UPI', 'CASH', 'CARD') DEFAULT 'CASH',
      status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      invoice_id INT NOT NULL,
      service_id INT NOT NULL,
      quantity INT DEFAULT 1,
      price DECIMAL(10, 2) NOT NULL,
      gst_percentage DECIMAL(5, 2),
      subtotal DECIMAL(10, 2),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      branch_id INT NOT NULL,
      employee_id INT NOT NULL,
      invoice_id INT,
      amount DECIMAL(10, 2) NOT NULL,
      payment_type ENUM('UPI', 'CASH', 'CARD') NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      branch_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category ENUM('rent', 'salary', 'electricity', 'supplies', 'misc') DEFAULT 'misc',
      receipt_image VARCHAR(255),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INT PRIMARY KEY AUTO_INCREMENT,
      branch_id INT NOT NULL,
      item_name VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      total_quantity INT DEFAULT 0,
      used_quantity INT DEFAULT 0,
      remaining_quantity INT DEFAULT 0,
      unit VARCHAR(20) DEFAULT 'pcs',
      min_stock_level INT DEFAULT 10,
      cost_per_unit DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_usage (
      id INT PRIMARY KEY AUTO_INCREMENT,
      inventory_id INT NOT NULL,
      employee_id INT NOT NULL,
      quantity_used INT NOT NULL,
      service_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      employee_id INT,
      branch_id INT,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'warning', 'alert', 'reminder') DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      employee_id INT NOT NULL,
      token VARCHAR(500),
      device_id VARCHAR(255),
      ip_address VARCHAR(45),
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      logout_time TIMESTAMP NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone VARCHAR(20) NOT NULL,
      otp VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      attempts INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20) UNIQUE;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL;

    INSERT IGNORE INTO branches (id, name, location, geo_latitude, geo_longitude, geo_radius, status) VALUES
    (1, 'Main Branch - Downtown', '123 Main Street, Downtown', 28.6139, 77.2090, 100, 'active'),
    (2, 'South Mall Branch', '456 Mall Road, South', 28.5355, 77.2500, 150, 'active');

    INSERT IGNORE INTO employees (id, name, role, phone, password, branch_id, salary, status) VALUES
    (1, 'Super Admin', 'admin', '9999999999', '${hashedPassword}', NULL, 0, 'active');
  `;

  try {
    await connection.query(schema);
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
  
  await connection.end();
};

if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = initDatabase;
