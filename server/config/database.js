const sql = require('mssql/msnodesqlv8');

/**
 * Master database configuration.
 * Stores the school registry, super admin profiles, and audit logs.
 * Uses Windows Authentication via msnodesqlv8 (ODBC native driver)
 * for reliable local development on Windows.
 */

// Build the ODBC connection string
function buildConnectionString(database) {
  const server = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
  const db = database || process.env.DB_MASTER_NAME || 'school_master_db';

  // If DB_USER is set, use SQL Server Authentication
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    return `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${db};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;
  }

  // Otherwise use Windows Authentication (Trusted_Connection)
  return `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${db};Trusted_Connection=yes;`;
}

const masterConfig = {
  connectionString: buildConnectionString(),
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

let masterPool = null;

/**
 * Get the master database connection pool.
 * Creates a new pool if one doesn't exist.
 */
async function getMasterPool() {
  if (masterPool && masterPool.connected) {
    return masterPool;
  }

  try {
    masterPool = new sql.ConnectionPool(masterConfig);
    await masterPool.connect();
    console.log('✅ Connected to master database (school_master_db)');
    return masterPool;
  } catch (err) {
    console.error('❌ Failed to connect to master database:', err.message);
    throw err;
  }
}

/**
 * Build a connection config for a specific database.
 * Used by tenantPool to create school-specific pools.
 */
function buildSchoolConfig(dbName) {
  return {
    connectionString: buildConnectionString(dbName),
    pool: {
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
    },
  };
}

/**
 * Close all database connections gracefully
 */
async function closeAll() {
  if (masterPool) {
    await masterPool.close();
    masterPool = null;
    console.log('🔌 Master database connection closed');
  }
}

module.exports = { sql, getMasterPool, buildSchoolConfig, buildConnectionString, closeAll };
