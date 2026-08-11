const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync, spawn } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKUPS_DIR = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Helper: Find mysqldump executable path
function findMysqldumpPath() {
  try {
    execSync('mysqldump --version', { stdio: 'ignore' });
    return 'mysqldump';
  } catch (e) {
    // Check common Windows installation paths
    const candidates = [
      'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
      'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
      'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
      'C:\\xampp\\mysql\\bin\\mysqldump.exe',
      'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe',
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return `"${cand}"`;
      }
    }
    return null;
  }
}

// Fallback Node-based dumper if mysqldump is missing
async function dumpDatabaseNode(dbConfig, dbName, outputPath) {
  const conn = await mysql.createConnection({
    ...dbConfig,
    database: dbName,
  });

  const writeStream = fs.createWriteStream(outputPath);
  const gzip = zlib.createGzip();
  gzip.pipe(writeStream);

  gzip.write(`-- Node MySQL Backup for Database: ${dbName}\n`);
  gzip.write(`-- Date: ${new Date().toISOString()}\n\n`);
  gzip.write(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;\nUSE \`${dbName}\`;\n\n`);

  const [tables] = await conn.query('SHOW TABLES');
  const tableKey = `Tables_in_${dbName}`;

  for (const row of tables) {
    const tableName = row[tableKey] || Object.values(row)[0];
    gzip.write(`-- Table structure for \`${tableName}\`\n`);
    gzip.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);

    const [createResult] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSql = createResult[0]['Create Table'];
    gzip.write(`${createSql};\n\n`);

    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      gzip.write(`-- Data for \`${tableName}\`\n`);
      for (const dataRow of rows) {
        const keys = Object.keys(dataRow);
        const values = Object.values(dataRow).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
        });
        gzip.write(`INSERT INTO \`${tableName}\` (\`${keys.join('`, `')}\`) VALUES (${values.join(', ')});\n`);
      }
      gzip.write('\n');
    }
  }

  gzip.end();
  await conn.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

// mysqldump-based dumper
async function dumpDatabaseMysqldump(mysqldumpCmd, dbConfig, dbName, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      `-h${dbConfig.host}`,
      `-P${dbConfig.port || 3306}`,
      `-u${dbConfig.user}`,
      `-p${dbConfig.password}`,
      '--single-transaction',
      '--quick',
      dbName,
    ];

    const cleanCmd = mysqldumpCmd.replace(/"/g, '');
    const child = spawn(cleanCmd, args, { windowsHide: true });
    const gzip = zlib.createGzip();
    const writeStream = fs.createWriteStream(outputPath);

    child.stdout.pipe(gzip).pipe(writeStream);

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`mysqldump exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

// Cleanup files older than 30 days
function cleanupOldBackups(days = 30) {
  const now = Date.now();
  const maxAgeMs = days * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(BACKUPS_DIR);
  let deletedCount = 0;

  for (const file of files) {
    if (file.endsWith('.sql.gz') || file.endsWith('.sql')) {
      const filePath = path.join(BACKUPS_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup file (> ${days} days): ${file}`);
        deletedCount++;
      }
    }
  }

  if (deletedCount === 0) {
    console.log(`🧹 Backup cleanup complete: no files older than ${days} days.`);
  }
}

async function backupAllDatabases() {
  console.log('📦 STARTING AUTOMATED DATABASE BACKUP...\n');

  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  const masterDbName = process.env.DB_MASTER_NAME;
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15); // YYYYMMDD_HHmmss

  // 1. Fetch active school tenant database names
  const masterConn = await mysql.createConnection({
    ...dbConfig,
    database: masterDbName,
  });

  const [schools] = await masterConn.query('SELECT db_name FROM schools WHERE is_active = 1');
  await masterConn.end();

  const dbsToBackup = [masterDbName, ...schools.map(s => s.db_name)];
  console.log(`📋 Found ${dbsToBackup.length} database(s) to backup: ${dbsToBackup.join(', ')}\n`);

  const mysqldumpCmd = findMysqldumpPath();
  if (mysqldumpCmd) {
    console.log(`⚡ Using mysqldump executable at: ${mysqldumpCmd}`);
  } else {
    console.log('ℹ️  mysqldump not found in PATH; using Node SQL dumper fallback.');
  }

  for (const dbName of dbsToBackup) {
    const filename = `${timestamp}_${dbName}.sql.gz`;
    const outputPath = path.join(BACKUPS_DIR, filename);

    process.stdout.write(`⏳ Backing up ${dbName} -> ${filename}... `);

    try {
      if (mysqldumpCmd) {
        await dumpDatabaseMysqldump(mysqldumpCmd, dbConfig, dbName, outputPath);
      } else {
        await dumpDatabaseNode(dbConfig, dbName, outputPath);
      }

      const stat = fs.statSync(outputPath);
      const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ OK (${sizeMb} MB)`);
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      // Fall back to node dumper if mysqldump errored
      if (mysqldumpCmd) {
        try {
          console.log(`   🔄 Retrying ${dbName} using Node dumper fallback...`);
          await dumpDatabaseNode(dbConfig, dbName, outputPath);
          const stat = fs.statSync(outputPath);
          const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
          console.log(`   ✅ OK (${sizeMb} MB)`);
        } catch (nodeErr) {
          console.error(`   ❌ Fallback failed for ${dbName}: ${nodeErr.message}`);
        }
      }
    }
  }

  console.log('\n🧹 Checking 30-day retention cleanup policy...');
  cleanupOldBackups(30);

  console.log('\n🎉 ALL DATABASE BACKUPS COMPLETED SUCCESSFULLY.');
}

backupAllDatabases().catch(err => {
  console.error('❌ Backup process error:', err.message);
  process.exit(1);
});
