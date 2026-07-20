const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const { data: blogData, error: blogErr } = await supabase.from('blog_posts').select('*').limit(5);
  const { data: annData, error: annErr } = await supabase.from('announcements').select('*').limit(5);
  console.log('blog_posts:', blogData?.length, blogErr);
  console.log('announcements:', annData?.length, annErr);
  if (annData && annData.length > 0) {
    console.log('announcement row:', annData[0]);
  }
}

checkTables();
