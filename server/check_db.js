require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: students } = await supabase.from('students').select('id, name, grade, academic_year, school_id');
  console.log('Students:', students);

  const { data: feeStructures } = await supabase.from('fee_structures').select('*');
  console.log('Fee Structures:', feeStructures);

  const { data: feeCollections } = await supabase.from('fee_collections').select('*');
  console.log('Fee Collections:', feeCollections);
}

check();
