const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Basic env parser
const env = {};
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
        const key = k.trim();
        const val = v.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
        env[key] = val;
    }
});

async function addPortal() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const personal_id = '9124911';
  const { data: sol } = await supabase.from('soldiers').select('id').eq('personal_number', personal_id).single();
  
  if (!sol) {
    console.error('Soldier not found');
    return;
  }

  console.log('Adding minimal portal for soldier:', sol.id);
  const { error } = await supabase.from('soldier_portals').insert([{
    soldier_id: sol.id,
    status: 'בפנים'
  }]);

  if (error) console.error('Error adding portal:', error);
  else console.log('Portal added successfully.');
}

addPortal();
