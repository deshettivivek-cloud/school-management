require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const checkSchema = async () => {
  try {
    const { data, error } = await supabase.rpc('get_profiles_schema_info');
    if (error) {
      // Fallback: try raw query if we can
      console.log("Can't use rpc. Fetching profiles...");
      const { data: pData } = await supabase.from('profiles').select('*').limit(1);
      console.log('Profile columns:', pData ? Object.keys(pData[0] || {}) : 'none');
    }
  } catch (err) {
    console.error(err);
  }
};

checkSchema();
