require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('fee_collections')
    .select('*, students!inner(name, admission_no, grade, section, parent_name, parent_phone)')
    .in('status', ['pending', 'partial', 'overdue'])
    .eq('academic_year', '2026-2027');

  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}

check();
