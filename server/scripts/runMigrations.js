const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function ensureMigrationTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(conn) {
  await ensureMigrationTable(conn);
  const [applied] = await conn.query('SELECT filename FROM _migrations');
  return new Set(applied.map(r => r.filename));
}

async function addSoftDeleteColumnIfMissing(conn, tableName) {
  try {
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = 'deleted_at'
    `, [tableName]);

    if (cols.length === 0) {
      console.log(`   ➕ Adding deleted_at to ${tableName}...`);
      await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`);
    } else {
      console.log(`   ℹ️  deleted_at already exists on ${tableName}`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Could not alter ${tableName}: ${err.message}`);
  }
}

async function runMigrations() {
  console.log('🔄 STARTING DATABASE MIGRATION RUNNER...\n');

  const masterConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_MASTER_NAME,
    multipleStatements: true,
  });

  console.log(`📌 Connected to Master DB: ${process.env.DB_MASTER_NAME}`);

  // 1. Run Master DB Migrations (Only master schema files)
  const masterApplied = await getAppliedMigrations(masterConn);
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    // Only master_schema runs directly on master DB
    if (file.includes('master_schema')) {
      if (masterApplied.has(file)) {
        console.log(`⏭  Master DB Skipping (already applied): ${file}`);
      } else {
        console.log(`▶  Master DB Running: ${file}`);
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        await masterConn.query(sql);
        await masterConn.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
        console.log(`✅ Master DB Applied: ${file}`);
      }
    }
  }

  // 2. Fetch all school databases for tenant migrations
  const [schools] = await masterConn.query('SELECT id, name, db_name FROM schools WHERE is_active = 1');
  console.log(`\n🏫 Found ${schools.length} active tenant database(s) for tenant migrations.\n`);

  for (const school of schools) {
    console.log(`=== Migrating Tenant DB: ${school.db_name} (${school.name}) ===`);
    try {
      const tenantConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: school.db_name,
        multipleStatements: true,
      });

      const tenantApplied = await getAppliedMigrations(tenantConn);

      for (const file of files) {
        // Skip master-only schema files for tenant DBs
        if (file.includes('master_schema')) continue;

        if (tenantApplied.has(file)) {
          console.log(`⏭  Tenant DB (${school.db_name}) Skipping (already applied): ${file}`);
          continue;
        }

        console.log(`▶  Tenant DB (${school.db_name}) Running: ${file}`);

        if (file.includes('add_soft_delete_columns')) {
          await addSoftDeleteColumnIfMissing(tenantConn, 'students');
          await addSoftDeleteColumnIfMissing(tenantConn, 'employees');
          await addSoftDeleteColumnIfMissing(tenantConn, 'fee_structures');
          await addSoftDeleteColumnIfMissing(tenantConn, 'expenditures');
          await tenantConn.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
          console.log(`✅ Tenant DB (${school.db_name}) Applied: ${file}`);
        } else {
          try {
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
            await tenantConn.query(sql);
            await tenantConn.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
            console.log(`✅ Tenant DB (${school.db_name}) Applied: ${file}`);
          } catch (fileErr) {
            console.warn(`⚠️ Tenant DB (${school.db_name}) Skipped non-MySQL file ${file}: ${fileErr.message}`);
          }
        }
      }

      await tenantConn.end();
    } catch (err) {
      console.error(`❌ Failed migrating tenant DB ${school.db_name}: ${err.message}`);
    }
  }

  await masterConn.end();
  console.log('\n🎉 MIGRATIONS COMPLETED SUCCESSFULLY.');
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});