const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || 'https://missing.supabase.co').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-key').trim();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. API calls will fail!');
}

// Service role client — full access, bypasses RLS
// Used for backend admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (supabaseAnonKey) {
  supabase.authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

module.exports = supabase;
