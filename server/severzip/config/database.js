const mysql = require('mysql2/promise');

function buildDbConfig(database) {
  let host = process.env.DB_HOST || '127.0.0.1';
  let port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

  const config = {
    host,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: database || process.env.DB_MASTER_NAME || 'school_master_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
  };

  return config;
}

const masterConfig = buildDbConfig();
let masterPool = null;

const RETRYABLE_ERRORS = new Set(['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ETIMEDOUT']);

async function getConnectionWithRetry(pool, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await pool.getConnection();
    } catch (err) {
      attempt++;
      const isRetryable = err.code && RETRYABLE_ERRORS.has(err.code);
      if (!isRetryable || attempt >= maxRetries) {
        throw err;
      }
      const backoffMs = 500 * Math.pow(2, attempt - 1);
      console.warn(`⚠️ DB connection attempt ${attempt} failed (${err.code}). Retrying in ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

async function getMasterPool() {
  if (masterPool) {
    return masterPool;
  }
  try {
    masterPool = mysql.createPool(masterConfig);
    // Test the connection with retry
    const connection = await getConnectionWithRetry(masterPool);
    
    const [rows] = await masterPool.query(`
      SELECT
      DATABASE() AS database_name,
      @@hostname AS hostname,
      @@port AS port,
      USER() AS logged_user
    `);
    console.table(rows);

    connection.release();
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
    await masterPool.end();
    masterPool = null;
    console.log('🔌 Master database connection closed');
  }
}

module.exports = { mysql, getMasterPool, buildSchoolConfig, closeAll, getConnectionWithRetry };
