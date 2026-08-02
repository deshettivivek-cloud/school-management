/**
 * Quick fix: Add missing columns (leaves_taken, paid_amount) to salary_records table
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

(async () => {
  let conn;
  try {
    // Connect to the school tenant database
    const dbName = process.argv[2] || 'class16c_School_1';
    console.log(`Connecting to database: ${dbName}`);
    
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    console.log('✅ Connected!\n');

    // Check existing columns
    const [columns] = await conn.query(`SHOW COLUMNS FROM salary_records`);
    const columnNames = columns.map(c => c.Field);
    console.log('Current columns:', columnNames.join(', '));

    // Add leaves_taken if missing
    if (!columnNames.includes('leaves_taken')) {
      await conn.query(`ALTER TABLE salary_records ADD COLUMN leaves_taken INT DEFAULT 0 AFTER payment_mode`);
      console.log('✅ Added leaves_taken column');
    } else {
      console.log('ℹ️  leaves_taken already exists');
    }

    // Add paid_amount if missing
    if (!columnNames.includes('paid_amount')) {
      await conn.query(`ALTER TABLE salary_records ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0 AFTER leaves_taken`);
      console.log('✅ Added paid_amount column');
    } else {
      console.log('ℹ️  paid_amount already exists');
    }

    console.log('\n🎉 Done! Salary generation should now work.');
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (conn) await conn.end();
    process.exit(1);
  }
})();
