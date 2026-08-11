const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'classorbit', password: 'Vivek@0061$', database: 'school_1786036936027'
  });
  
  const [tables] = await conn.query("SHOW TABLES LIKE 'bug_reports'");
  console.log(`Tables:`, tables);
  await conn.end();
}
check().catch(console.error);
