require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const seedSuperAdmin = async () => {
  try {
    console.log('🔄 Seeding Super Admin user via Supabase...\n');

    const email = 'superadmin@schoolms.com';
    const password = 'SuperAdmin@2026';
    const name = 'Super Admin';

    // Check if user already exists by listing users
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      console.log('⚠️  Super Admin user already exists.');

      // Ensure profile role is super_admin
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'super_admin', name, must_change_password: false })
        .eq('id', existingUser.id);

      if (!error) {
        console.log('✅ Profile role confirmed as super_admin.');
      }

      process.exit(0);
    }

    // Create user via Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, full_name: name },
    });

    if (authError) {
      console.dir(authError, { depth: null });
      throw authError;
    }

    console.log('✅ User created in Supabase Auth');

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update profile role to super_admin
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin', name, must_change_password: false })
      .eq('id', authData.user.id);

    if (roleError) {
      console.warn('⚠️  Could not update profile role:', roleError.message);
      console.log('   You may need to manually set the role to "super_admin" in the profiles table.');
    } else {
      console.log('✅ Profile role set to super_admin');
    }

    console.log('\n✅ Super Admin created successfully:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: super_admin`);
    console.log('');
    console.log('⚠️  Please change the password after first login!');
    console.log('🔐 Login at: /super-admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
