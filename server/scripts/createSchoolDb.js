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

  // On shared hosting (BigRock/HostGator), databases must be pre-created via cPanel.
  // The dbName must be provided by the admin and must already exist with user access granted.
  const dbName = options.dbName;
  if (!dbName) {
    throw new Error('Database name is required. Please create the database in cPanel first and provide its name.');
  }

  console.log(`\n📗 Creating school database: ${dbName}`);
  console.log(`   School: ${schoolName}`);
  console.log(`   Join Code: ${joinCode}`);
  console.log(`   Academic Year: ${academicYear}`);

  try {
    // Step 1: Check if database already exists
    // COMMENTED OUT: HostGator shared hosting doesn't allow SHOW DATABASES
    // const [existsResult] = await masterPool.query(
    //   `SHOW DATABASES LIKE '${dbName}'`
    // );
    //
    // if (existsResult.length > 0) {
    //   console.error(`❌ Database '${dbName}' already exists!`);
    //   return null;
    // }

    // Step 2: Create the database
    // COMMENTED OUT: HostGator shared hosting doesn't allow CREATE DATABASE
    // Database must be pre-created via phpMyAdmin
    // console.log('   Creating database...');
    // await masterPool.query(`CREATE DATABASE \`${dbName}\``);
    // console.log(`   ✅ Database \`${dbName}\` created`);

    // Step 3: Wait briefly for the database to be fully available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Apply school template schema
    console.log('   Applying schema template...');
    const templatePath = path.join(__dirname, '..', 'migrations', '002_school_template.sql');
    const templateSQL = fs.readFileSync(templatePath, 'utf8');

    const schoolPool = await getSchoolPool(dbName);

    // Execute the whole template file
    try {
      await schoolPool.query(templateSQL);
    } catch (batchErr) {
      console.warn(`   ⚠️ Template warning: ${batchErr.message.substring(0, 100)}`);
    }
    console.log('   ✅ Schema template applied');

    // Step 5: Register in master database
    console.log('   Registering in master database...');
    const schoolId = crypto.randomUUID();

    await masterPool.execute(
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

    console.log(`   ✅ School registered with ID: ${schoolId}`);

    // Step 6: Create Principal user
    if (principalEmail && principalPassword) {
      console.log('   Creating Principal account...');
      const passwordHash = await hashPassword(principalPassword);
      const principalId = crypto.randomUUID();

      await schoolPool.execute(
        `INSERT INTO profiles (id, email, password_hash, name, role, must_change_password)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [principalId, principalEmail, passwordHash, options.principalName || 'Principal', 'principal', 1]
      );

      // Add to global_users
      await masterPool.execute(
        `INSERT INTO global_users (id, email, school_id) VALUES (?, ?, ?)`,
        [crypto.randomUUID(), principalEmail, schoolId]
      );

      console.log(`   ✅ Principal account created: ${principalEmail}`);
    }

    console.log(`\n🎉 School '${schoolName}' created successfully!`);
    console.log(`   Database: ${dbName}`);
    console.log(`   School ID: ${schoolId}`);
    console.log(`   Join Code: ${joinCode}\n`);

    return { id: schoolId, name: schoolName, joinCode, dbName };
  } catch (err) {
    console.error(`\n❌ Failed to create school:`, err.message);

    // Cleanup: try to drop the database if it was partially created
    try {
      // COMMENTED OUT: HostGator shared hosting doesn't allow DROP DATABASE
      // await masterPool.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      // console.log(`   🧹 Cleaned up partial database: ${dbName}`);

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
