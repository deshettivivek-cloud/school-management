require('dotenv').config();
const { getMasterPool } = require('./config/database');

async function test() {
  try {
    const pool = await getMasterPool();
    const [rows] = await pool.query('DESCRIBE audit_logs');
    console.log(rows);
    try {
        const [logs] = await pool.query(\
          SELECT al.*, p.name as profile_name, p.email as profile_email 
          FROM audit_logs al
          LEFT JOIN super_admin_profiles p ON al.user_id = p.id
          ORDER BY al.created_at DESC LIMIT 1
        \);
        console.log("Query success:", logs.length);
    } catch(e) {
        console.log("Query Error:", e.message);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
