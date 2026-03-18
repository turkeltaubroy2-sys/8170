const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gcsixiixqebbkktarayc.supabase.co',
  'sb_publishable_ai1PNCShYIekZ951RXiZFw_GxOxlfsB'
);

async function fixDepartments() {
  console.log('Fetching departments...');
  const { data: depts, error: fetchErr } = await supabase.from('departments').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  
  console.log('Current departments:', depts);
  
  console.log('Deleting all existing departments...');
  const { error: delErr } = await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.error('Delete error:', delErr);
    return;
  }
  
  console.log('Inserting correct departments...');
  const { error: insErr } = await supabase.from('departments').insert([
    { name: 'מחלקה 1', icon: '1', "order": 1 },
    { name: 'מחלקה 2', icon: '2', "order": 2 }
  ]);
  
  if (insErr) {
    console.error('Insert error:', insErr);
  } else {
    console.log('✅ Departments fixed!');
  }
}

fixDepartments();
