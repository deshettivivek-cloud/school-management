require('dotenv').config();
const { getMasterPool } = require('./config/database');
const { hashPassword } = require('./config/auth');

const seedSuperAdmin = async () => {
  try {
    console.log('🔄 Seeding Super Admin user to Master DB...\n');

    const email = 'superadmin@schoolms.com';
    const password = 'SuperAdmin@2026';
    const name = 'Super Admin';

    const masterPool = await getMasterPool();

    // Check if user already exists
    const [rows] = await masterPool.execute(
      'SELECT * FROM super_admin_profiles WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      console.log('⚠️  Super Admin user already exists in DB.');
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);

    // Create user via MySQL
    await masterPool.execute(
      `INSERT INTO super_admin_profiles (email, password_hash, name, role, must_change_password)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, name, 'super_admin', 1]
    );

    console.log('\n✅ Super Admin created successfully:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: super_admin`);
    console.log('');
    console.log('⚠️  Please change the password after first login!');
    console.log('🔐 Login at: http://localhost:3000/super-admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
