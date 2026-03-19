const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data: existing } = await supabase.from('soldiers').select('id').eq('username', '8075039').single();
  
  if (existing) {
    const { error } = await supabase.from('soldiers').update({ password: 'turkeltaub998!' }).eq('id', existing.id);
    if (!error) console.log('Updated existing user 8075039');
    else console.error('Error updating:', error);
  } else {
    // Get a department
    const { data: deps } = await supabase.from('departments').select('id').limit(1);
    const dep_id = deps[0]?.id;
    
    // insert new
    const { error } = await supabase.from('soldiers').insert({
      username: '8075039',
      password: 'turkeltaub998!',
      full_name: 'רועי טורקלטאוב',
      rank: 'רס"ר',
      role: 'סגל',
      department_id: dep_id,
      unique_token: crypto.randomUUID()
    });
    
    if (!error) console.log('Inserted new user 8075039');
    else console.error('Error inserting:', error);
  }
}
main();
