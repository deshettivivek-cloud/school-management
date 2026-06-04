require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const seedAdmin = async () => {
  try {
    console.log('🔄 Seeding admin user via Supabase...\n');

    const email = 'admin@school.com';
    const password = 'admin123';
    const name = 'Admin';

    // Check if user already exists by listing users
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      console.log('⚠️  Admin user already exists.');

      // Ensure profile role is admin
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin', name })
        .eq('id', existingUser.id);

      if (!error) {
        console.log('✅ Profile role confirmed as admin.');
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
      throw authError;
    }

    console.log('✅ User created in Supabase Auth');

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update profile role to admin
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'admin', name })
      .eq('id', authData.user.id);

    if (roleError) {
      console.warn('⚠️  Could not update profile role:', roleError.message);
      console.log('   You may need to manually set the role to "admin" in the profiles table.');
    } else {
      console.log('✅ Profile role set to admin');
    }

    console.log('\n✅ Default admin created successfully:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: admin`);
    console.log('');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
