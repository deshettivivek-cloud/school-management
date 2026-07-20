/**
 * Script: Create a new school database
 * 
 * Usage: node scripts/createSchoolDb.js <schoolName> <joinCode> <academicYear> <principalEmail> <principalPassword>
 * 
 * Example: node scripts/createSchoolDb.js "Green Valley School" "GVS001" "2025-2026" "principal@gvs.in" "TempPass123!"
 * 
 * This script:
 * 1. Creates a new SQL Server database for the school
 * 2. Applies the school template schema
 * 3. Registers the school in the master database
 * 4. Creates the Principal user account
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { sql, getMasterPool } = require('../config/database');
const { getSchoolPool } = require('../config/tenantPool');
const { hashPassword } = require('../config/auth');

async function createSchoolDatabase(schoolName, joinCode, academicYear, principalEmail, principalPassword, options = {}) {
  const masterPool = await getMasterPool();
  
  // Sanitize join code for database name
  const safeName = joinCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dbName = `school_${safeName}_db`;

  console.log(`\n📗 Creating school database: ${dbName}`);
  console.log(`   School: ${schoolName}`);
  console.log(`   Join Code: ${joinCode}`);
  console.log(`   Academic Year: ${academicYear}`);

  try {
    // Step 1: Check if database already exists
    const existsResult = await masterPool.request()
      .query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);

    if (existsResult.recordset.length > 0) {
      console.error(`❌ Database '${dbName}' already exists!`);
      return null;
    }

    // Step 2: Create the database
    console.log('   Creating database...');
    await masterPool.request().batch(`CREATE DATABASE [${dbName}]`);
    console.log(`   ✅ Database [${dbName}] created`);

    // Step 3: Wait briefly for the database to be fully available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Apply school template schema
    console.log('   Applying schema template...');
    const templatePath = path.join(__dirname, '..', 'migrations', '002_school_template.sql');
    const templateSQL = fs.readFileSync(templatePath, 'utf8');

    const schoolPool = await getSchoolPool(dbName);
    
    // Split by GO and execute each batch
    const batches = templateSQL.split(/\nGO\b/gi).filter(b => b.trim().length > 0);
    for (const batch of batches) {
      const trimmed = batch.trim();
      if (trimmed && trimmed.length > 5) {
        try {
          await schoolPool.request().batch(trimmed);
        } catch (batchErr) {
          // Ignore "already exists" errors for idempotency
          if (!batchErr.message.includes('already an object')) {
            console.warn(`   ⚠️ Batch warning: ${batchErr.message.substring(0, 100)}`);
          }
        }
      }
    }
    console.log('   ✅ Schema template applied');

    // Step 5: Register in master database
    console.log('   Registering in master database...');
    const schoolResult = await masterPool.request()
      .input('name', sql.NVarChar, schoolName)
      .input('joinCode', sql.NVarChar, joinCode)
      .input('dbName', sql.NVarChar, dbName)
      .input('academicYear', sql.NVarChar, academicYear)
      .input('address', sql.NVarChar, options.address || '')
      .input('phone', sql.NVarChar, options.phone || '')
      .input('email', sql.NVarChar, options.email || '')
      .input('logoUrl', sql.NVarChar, options.logoUrl || '')
      .query(`
        INSERT INTO schools (name, join_code, db_name, academic_year, address, phone, email, logo_url)
        OUTPUT INSERTED.*
        VALUES (@name, @joinCode, @dbName, @academicYear, @address, @phone, @email, @logoUrl)
      `);

    const school = schoolResult.recordset[0];
    console.log(`   ✅ School registered with ID: ${school.id}`);

    // Step 6: Create Principal user
    if (principalEmail && principalPassword) {
      console.log('   Creating Principal account...');
      const passwordHash = await hashPassword(principalPassword);

      await schoolPool.request()
        .input('email', sql.NVarChar, principalEmail)
        .input('passwordHash', sql.NVarChar, passwordHash)
        .input('name', sql.NVarChar, options.principalName || 'Principal')
        .input('role', sql.NVarChar, 'principal')
        .query(`
          INSERT INTO profiles (email, password_hash, name, role, must_change_password)
          VALUES (@email, @passwordHash, @name, @role, 1)
        `);

      // Add to global routing table
      await masterPool.request()
        .input('email', sql.NVarChar, principalEmail)
        .input('schoolId', sql.UniqueIdentifier, school.id)
        .query(`
          INSERT INTO global_users (email, school_id)
          VALUES (@email, @schoolId)
        `);

      console.log(`   ✅ Principal account created: ${principalEmail}`);
    }

    console.log(`\n🎉 School '${schoolName}' created successfully!`);
    console.log(`   Database: ${dbName}`);
    console.log(`   School ID: ${school.id}`);
    console.log(`   Join Code: ${joinCode}\n`);

    return school;
  } catch (err) {
    console.error(`\n❌ Failed to create school:`, err.message);
    
    // Cleanup: try to drop the database if it was partially created
    try {
      await masterPool.request().batch(`
        IF EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
        BEGIN
          ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
          DROP DATABASE [${dbName}];
        END
      `);
      console.log(`   🧹 Cleaned up partial database: ${dbName}`);
      
      // Also clean up from master tables if registered
      await masterPool.request().query(`
        DELETE FROM global_users WHERE school_id IN (SELECT id FROM schools WHERE db_name = '${dbName}');
        DELETE FROM schools WHERE db_name = '${dbName}';
      `);
      console.log(`   🧹 Cleaned up master database records for: ${dbName}`);
    } catch (cleanupErr) {
      console.error(`   ⚠️ Cleanup failed:`, cleanupErr.message);
    }

    throw err;
  }
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.log('Usage: node scripts/createSchoolDb.js <schoolName> <joinCode> <academicYear> <principalEmail> <principalPassword>');
    console.log('Example: node scripts/createSchoolDb.js "Green Valley School" "GVS001" "2025-2026" "principal@gvs.in" "TempPass123!"');
    process.exit(1);
  }

  const [schoolName, joinCode, academicYear, principalEmail, principalPassword] = args;

  createSchoolDatabase(schoolName, joinCode, academicYear, principalEmail, principalPassword)
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { createSchoolDatabase };
