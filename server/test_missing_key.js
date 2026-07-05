const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zzmnbhvocecjqynpyvdb.supabase.co';
const supabase = createClient(supabaseUrl, 'missing-key', { auth: { persistSession: false } });

async function testMissingKey() {
  const { error } = await supabase.from('schools').insert([{ name: 'Test' }]);
  console.log('Error with missing key:', error);
}

testMissingKey();
