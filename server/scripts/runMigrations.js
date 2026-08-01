const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_MASTER_NAME,
    multipleStatements: true,
  });

  // Track which migrations already ran
  await connection.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [applied] = await connection.query('SELECT filename FROM _migrations');
  const appliedNames = new Set(applied.map(r => r.filename));

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // alphabetical — keep filenames date-prefixed so order is correct

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`⏭  Skipping (already applied): ${file}`);
      continue;
    }

    console.log(`▶  Running: ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await connection.query(sql);
    await connection.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
    console.log(`✅ Applied: ${file}`);
  }

  console.log('🎉 All migrations up to date.');
  await connection.end();
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});