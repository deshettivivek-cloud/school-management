require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resetSuperAdmin = async () => {
  try {
    const oldEmail = 'superadmin@schoolms.com';
    const newEmail = 'newadmin@schoolms.com';
    const newPassword = 'NewSecurePassword@2027';

    console.log(`🔄 Looking up Super Admin ID in profiles table...`);
    
    // First, find the super_admin profile directly
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'super_admin');

    if (profileError) throw profileError;

    let targetId = null;
    let currentEmail = null;

    if (profiles && profiles.length > 0) {
      targetId = profiles[0].id;
      currentEmail = profiles[0].email;
      console.log(`✅ Found Super Admin profile with ID: ${targetId} (Email: ${currentEmail})`);
    } else {
      // Fallback: search by oldEmail
      const { data: emailProfiles, error: emailError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', oldEmail);
        
      if (emailError) throw emailError;
      
      if (emailProfiles && emailProfiles.length > 0) {
        targetId = emailProfiles[0].id;
        currentEmail = emailProfiles[0].email;
        console.log(`✅ Found Super Admin profile by email with ID: ${targetId}`);
      } else {
        return console.log('❌ Super Admin profile not found in database.');
      }
    }

    console.log(`🔄 Updating user auth credentials...`);
    const { data, error } = await supabase.auth.admin.updateUserById(
      targetId,
      { email: newEmail, password: newPassword, email_confirm: true }
    );

    if (error) {
      console.error('❌ Supabase Auth Update Error:', error.message);
      throw error;
    }

    console.log(`🔄 Updating profile email...`);
    await supabase.from('profiles').update({ email: newEmail }).eq('id', targetId);

    console.log('\n✅ Super Admin credentials reset successfully!');
    console.log(`   New Username/Email: ${newEmail}`);
    console.log(`   New Password: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting Super Admin:', error.message || error);
    process.exit(1);
  }
};

resetSuperAdmin();
