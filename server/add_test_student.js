require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const addStudent = async () => {
  // get a school id
  const { data: schools } = await supabase.from('schools').select('id').limit(1);
  if (!schools || schools.length === 0) {
    console.log("No schools found.");
    process.exit(1);
  }
  const schoolId = schools[0].id;

  const { data, error } = await supabase.from('students').insert({
    school_id: schoolId,
    name: 'Test Student',
    dob: '2010-01-01',
    gender: 'male',
    grade: '10',
    parent_name: 'Test Parent',
    parent_phone: '1234567890',
    academic_year: '2024-25',
    admission_no: 'TEST-001',
    is_active: true
  });
  
  if (error) {
    console.error(error);
  } else {
    console.log("Student added!");
  }
  process.exit(0);
};

addStudent();
