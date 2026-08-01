const { getMasterPool, buildSchoolConfig, getConnectionWithRetry } = require('./database');
const mysql = require('mysql2/promise');

const pools = new Map();
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_POOLS = 50;
let cleanupTimer = null;

async function evictLruPool() {
  if (pools.size === 0) return;
  let oldestDbName = null;
  let oldestLastUsed = Infinity;

  for (const [dbName, entry] of pools) {
    if (entry.lastUsed < oldestLastUsed) {
      oldestLastUsed = entry.lastUsed;
      oldestDbName = dbName;
    }
  }

  if (oldestDbName) {
    const entry = pools.get(oldestDbName);
    pools.delete(oldestDbName);
    await entry.pool.end().catch(console.error);
    console.log(`🗑️ LRU Evicted pool: ${oldestDbName}`);
  }
}

async function getSchoolPool(dbName) {
  if (pools.has(dbName)) {
    const entry = pools.get(dbName);
    entry.lastUsed = Date.now();
    return entry.pool;
  }

  if (pools.size >= MAX_POOLS) {
    await evictLruPool();
  }

  const schoolConfig = buildSchoolConfig(dbName);
  const pool = mysql.createPool(schoolConfig);

  // Test the connection with retry
  const connection = await getConnectionWithRetry(pool);
  connection.release();

  pools.set(dbName, {
    pool,
    dbName,
    lastUsed: Date.now(),
  });

  console.log(`📗 Connected to school database: ${dbName}`);
  return pool;
}

async function resolveSchoolDbName(schoolId) {
  const master = await getMasterPool();
  const [rows] = await master.execute('SELECT db_name FROM schools WHERE id = ?', [schoolId]);

  if (!rows || rows.length === 0) {
    const err = new Error('School not found');
    err.status = 404;
    throw err;
  }

  return rows[0].db_name;
}

async function tenantResolver(req, res, next) {
  try {
    if (req.user && req.user.isSuperAdmin) {
      req.db = await getMasterPool();
      req.isMasterDb = true;
      return next();
    }

    const tenantDb = req.user?.tenantDb;
    if (!tenantDb) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not assigned to a school database.',
      });
    }

    req.db = await getSchoolPool(tenantDb);
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

function cleanupIdlePools() {
  const now = Date.now();
  for (const [dbName, entry] of pools) {
    if (now - entry.lastUsed > IDLE_TIMEOUT_MS) {
      entry.pool.end().catch(console.error);
      pools.delete(dbName);
      console.log(`🧹 Closed idle pool: ${dbName}`);
    }
  }
}

function startCleanupTimer() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupIdlePools, IDLE_TIMEOUT_MS / 2);
    if (cleanupTimer.unref) cleanupTimer.unref();
  }
}

async function closeAllTenantPools() {
  for (const [dbName, entry] of pools) {
    await entry.pool.end().catch(console.error);
    console.log(`🔌 Closed school pool: ${dbName}`);
  }
  pools.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

function getPoolStats() {
  const stats = [];
  for (const [dbName, entry] of pools) {
    stats.push({
      dbName,
      connected: true,
      lastUsed: new Date(entry.lastUsed).toISOString(),
      idleMinutes: Math.round((Date.now() - entry.lastUsed) / 60000),
    });
  }
  return { totalPools: pools.size, pools: stats };
}

startCleanupTimer();

module.exports = {
  getSchoolPool,
  resolveSchoolDbName,
  tenantResolver,
  closeAllTenantPools,
  getPoolStats,
};
