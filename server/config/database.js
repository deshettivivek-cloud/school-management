const sql = require('mssql');

function buildDbConfig(database) {
  let serverName = process.env.DB_SERVER || 'localhost';
  let instanceName;
  
  if (serverName.includes('\\')) {
    const parts = serverName.split('\\');
    serverName = parts[0];
    instanceName = parts[1];
  }

  const config = {
    server: serverName,
    database: database || process.env.DB_MASTER_NAME || 'school_master_db',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: { max: 10, min: 2, idleTimeoutMillis: 30000 },
  };

  if (instanceName) {
    config.options.instanceName = instanceName;
  }
  if (process.env.DB_PORT) {
    config.port = parseInt(process.env.DB_PORT, 10);
  } else if (!instanceName) {
    config.port = 1433;
  }

  return config;
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
