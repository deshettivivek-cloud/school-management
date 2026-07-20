const sql = require('mssql');

function buildDbConfig(database) {
  return {
    server: process.env.DB_SERVER,
    database: database || process.env.DB_MASTER_NAME || 'school_master_db',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: true,
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    },
    pool: { max: 10, min: 2, idleTimeoutMillis: 30000 },
  };
}

const masterConfig = buildDbConfig();

let masterPool = null;

async function getMasterPool() {
  if (masterPool && masterPool.connected) {
    return masterPool;
  }
  try {
    masterPool = new sql.ConnectionPool(masterConfig);
    await masterPool.connect();
    console.log('✅ Connected to master database');
    return masterPool;
  } catch (err) {
    console.error('❌ Failed to connect to master database:', err.message);
    throw err;
  }
}

function buildSchoolConfig(dbName) {
  return buildDbConfig(dbName);
}

async function closeAll() {
  if (masterPool) {
    await masterPool.close();
    masterPool = null;
    console.log('🔌 Master database connection closed');
  }
}

module.exports = { sql, getMasterPool, buildSchoolConfig, closeAll };
