/**
 * Script: Create a new school database
 * 
 * Usage: node scripts/createSchoolDb.js <schoolName> <joinCode> <academicYear> <principalEmail> <principalPassword>
 * 
 * Example: node scripts/createSchoolDb.js "Green Valley School" "GVS001" "2025-2026" "principal@gvs.in" "TempPass123!"
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getMasterPool } = require('../config/database');
const { getSchoolPool } = require('../config/tenantPool');
const { hashPassword } = require('../config/auth');

async function createSchoolDatabase(schoolName, joinCode, academicYear, principalEmail, principalPassword, options = {}) {
  const masterPool = await getMasterPool();

  // Generate a dbName if not provided
  const dbName = options.dbName || `school_${Date.now()}`;

  console.log(`\n📗 Creating school database: ${dbName}`);
  console.log(`   School: ${schoolName}`);
  console.log(`   Join Code: ${joinCode}`);
  console.log(`   Academic Year: ${academicYear}`);

  try {
    // Step 1: Check if database already exists
    const [existsResult] = await masterPool.query(
      `SHOW DATABASES LIKE '${dbName}'`
    );

    if (existsResult.length > 0) {
      console.error(`❌ Database '${dbName}' already exists!`);
      return null;
    }

    // Step 2: Create the database
    console.log('   Creating database...');
    await masterPool.query(`CREATE DATABASE \`${dbName}\``);
    console.log(`   ✅ Database \`${dbName}\` created`);

    // Step 3: Wait briefly for the database to be fully available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Apply school template schema
    console.log('   Applying schema template...');
    const templatePath = path.join(__dirname, '..', 'migrations', '20260102_school_template.sql');
    const templateSQL = fs.readFileSync(templatePath, 'utf8');

    const schoolPool = await getSchoolPool(dbName);

    // Execute the whole template file
    try {
      await schoolPool.query(templateSQL);
      console.log('   ✅ Schema template applied');
    } catch (batchErr) {
      throw new Error(`Schema template execution failed: ${batchErr.message}`);
    }

    // Step 5: Register in master database using Transaction
    console.log('   Registering in master database...');
    const schoolId = crypto.randomUUID();
    const principalId = crypto.randomUUID();
    let masterConn = null;

    try {
      masterConn = await masterPool.getConnection();
      await masterConn.beginTransaction();

      await masterConn.execute(
        `INSERT INTO schools (id, name, join_code, db_name, academic_year, address, phone, email, logo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolId,
          schoolName,
          joinCode,
          dbName,
          academicYear,
          options.address || '',
          options.phone || '',
          options.email || '',
          options.logoUrl || ''
        ]
      );

      // Step 6: Create Principal user
      if (principalEmail && principalPassword) {
        console.log('   Creating Principal account...');
        const passwordHash = await hashPassword(principalPassword);

        // Insert into tenant database
        await schoolPool.execute(
          `INSERT INTO profiles (id, email, password_hash, name, role, must_change_password)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [principalId, principalEmail, passwordHash, options.principalName || 'Principal', 'principal', 1]
        );

        // Add to global_users in master database transaction
        await masterConn.execute(
          `INSERT INTO global_users (id, email, school_id) VALUES (?, ?, ?)`,
          [crypto.randomUUID(), principalEmail, schoolId]
        );
      }

      await masterConn.commit();
      console.log(`   ✅ School registered with ID: ${schoolId}`);
      if (principalEmail) console.log(`   ✅ Principal account created: ${principalEmail}`);
    } catch (txErr) {
      if (masterConn) await masterConn.rollback();
      throw new Error(`Master DB transaction failed: ${txErr.message}`);
    } finally {
      if (masterConn) masterConn.release();
    }

    // Step 7: Final Verification
    console.log('   Verifying provisioning success...');
    const [dbCheck] = await masterPool.query(`SHOW DATABASES LIKE '${dbName}'`);
    if (dbCheck.length === 0) throw new Error('Verification failed: Database does not exist.');

    const [tablesCheck] = await schoolPool.query('SHOW TABLES');
    if (tablesCheck.length === 0) throw new Error('Verification failed: Tables were not created.');

    if (principalEmail) {
       const [principalCheck] = await schoolPool.query('SELECT id FROM profiles WHERE email = ?', [principalEmail]);
       if (principalCheck.length === 0) throw new Error('Verification failed: Principal account not found in tenant database.');

       const [globalCheck] = await masterPool.query('SELECT id FROM global_users WHERE email = ? AND school_id = ?', [principalEmail, schoolId]);
       if (globalCheck.length === 0) throw new Error('Verification failed: Principal account not found in global_users.');
    }
    console.log('   ✅ Verification successful.');

    console.log(`\n🎉 School '${schoolName}' created successfully!`);
    console.log(`   Database: ${dbName}`);
    console.log(`   School ID: ${schoolId}`);
    console.log(`   Join Code: ${joinCode}\n`);

    return { id: schoolId, name: schoolName, joinCode, dbName };
  } catch (err) {
    console.error(`\n❌ Failed to create school:`, err.message);

    // Cleanup: try to drop the database if it was partially created
    try {
      await masterPool.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      console.log(`   🧹 Cleaned up partial database: ${dbName}`);

      await masterPool.execute('DELETE FROM schools WHERE db_name = ?', [dbName]);
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
