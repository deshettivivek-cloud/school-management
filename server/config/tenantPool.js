const sql = require('mssql/msnodesqlv8');
const { getMasterPool, buildSchoolConfig } = require('./database');

/**
 * Tenant Pool Manager — Option 1 (Separate Database per School)
 * 
 * Manages dynamic SQL Server connection pools for each school's database.
 * Pools are created lazily on first request and cached for reuse.
 * Idle pools are cleaned up periodically to save memory.
 */

// Cache: schoolId → { pool, dbName, lastUsed }
const pools = new Map();

// Cleanup interval: close pools idle for > 10 minutes
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
let cleanupTimer = null;

/**
 * Get or create a connection pool for a specific school database.
 * @param {string} dbName - The database name (e.g., 'school_abc123_db')
 * @returns {Promise<sql.ConnectionPool>} The connected pool
 */
async function getSchoolPool(dbName) {
  if (pools.has(dbName)) {
    const entry = pools.get(dbName);
    entry.lastUsed = Date.now();
    if (entry.pool.connected) {
      return entry.pool;
    }
    // Pool was disconnected — recreate it
    pools.delete(dbName);
  }

  const schoolConfig = buildSchoolConfig(dbName);
  const pool = new sql.ConnectionPool(schoolConfig);
  await pool.connect();

  pools.set(dbName, {
    pool,
    dbName,
    lastUsed: Date.now(),
  });

  console.log(`📗 Connected to school database: ${dbName}`);
  return pool;
}

/**
 * Resolve a schoolId to its database name by looking up the master DB.
 * @param {string} schoolId - The UUID of the school
 * @returns {Promise<string>} The database name
 */
async function resolveSchoolDbName(schoolId) {
  const master = await getMasterPool();
  const result = await master.request()
    .input('schoolId', sql.UniqueIdentifier, schoolId)
    .query('SELECT db_name FROM schools WHERE id = @schoolId');

  if (!result.recordset || result.recordset.length === 0) {
    const err = new Error('School not found');
    err.status = 404;
    throw err;
  }

  return result.recordset[0].db_name;
}

/**
 * Express middleware: Resolve the authenticated user's school to a DB pool.
 * After this middleware, `req.db` is the connected pool for the user's school.
 * Super Admins get `req.db` set to the master pool.
 */
async function tenantResolver(req, res, next) {
  try {
    // Super Admins use the master database
    if (req.user && req.user.isSuperAdmin) {
      req.db = await getMasterPool();
      req.isMasterDb = true;
      return next();
    }

    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not assigned to a school.',
      });
    }

    const dbName = await resolveSchoolDbName(schoolId);
    req.db = await getSchoolPool(dbName);
    req.isMasterDb = false;
    next();
  } catch (err) {
    console.error('Tenant resolver error:', err.message);
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
}

/**
 * Clean up idle pools to prevent memory leaks.
 * Called periodically by the cleanup timer.
 */
function cleanupIdlePools() {
  const now = Date.now();
  for (const [dbName, entry] of pools) {
    if (now - entry.lastUsed > IDLE_TIMEOUT_MS) {
      entry.pool.close().catch(console.error);
      pools.delete(dbName);
      console.log(`🧹 Closed idle pool: ${dbName}`);
    }
  }
}

/**
 * Start the idle pool cleanup timer.
 */
function startCleanupTimer() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupIdlePools, IDLE_TIMEOUT_MS / 2);
    // Allow process to exit without waiting for timer
    if (cleanupTimer.unref) cleanupTimer.unref();
  }
}

/**
 * Close all tenant pools gracefully (for shutdown).
 */
async function closeAllTenantPools() {
  for (const [dbName, entry] of pools) {
    await entry.pool.close().catch(console.error);
    console.log(`🔌 Closed school pool: ${dbName}`);
  }
  pools.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Get current pool statistics (for monitoring/health checks).
 */
function getPoolStats() {
  const stats = [];
  for (const [dbName, entry] of pools) {
    stats.push({
      dbName,
      connected: entry.pool.connected,
      lastUsed: new Date(entry.lastUsed).toISOString(),
      idleMinutes: Math.round((Date.now() - entry.lastUsed) / 60000),
    });
  }
  return { totalPools: pools.size, pools: stats };
}

// Start cleanup on module load
startCleanupTimer();

module.exports = {
  getSchoolPool,
  resolveSchoolDbName,
  tenantResolver,
  closeAllTenantPools,
  getPoolStats,
};
