require('dotenv').config();
const supabase = require('./config/supabase');

async function testCreateSchool() {
  const { data, error } = await supabase
    .from('schools')
    .insert([{
      name: 'Test School',
      join_code: 'TEST1234',
      academic_year: '2023-2024'
    }])
    .select();
    
  console.log('Result:', data);
  if (error) console.error('Error:', error);
}

testCreateSchool();
