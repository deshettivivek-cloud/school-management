require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFix() {
  console.log('Checking profiles table...');
  
  // Try to select from profiles
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    console.error('Error selecting from profiles:', error.message);
    
    // If table doesn't exist, let's create it via RPC if we have one, or we can just run SQL
    console.log('Trying to force reload schema cache...');
    const { error: rpcError } = await supabase.rpc('reload_schema_cache');
    if (rpcError) console.error('RPC Error:', rpcError.message);
  } else {
    console.log('Profiles table exists! Found rows:', data?.length);
  }
}

checkAndFix();
