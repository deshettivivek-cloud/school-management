require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const fixAdmin = async () => {
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === 'admin@school.com');
    if (!adminUser) return console.log('Admin user not found');
    
    console.log('Trying to insert as principal...');
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: adminUser.id,
        email: adminUser.email,
        name: 'Admin',
        role: 'principal'
      })
      .select();
      
    if (error) console.error('Insert error with principal:', error);
    else console.log('Success with principal!');
  } catch (err) {
    console.error(err);
  }
};

fixAdmin();
