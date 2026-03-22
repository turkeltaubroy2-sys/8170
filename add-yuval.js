const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

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

async function addYuval() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const soldierData = {
    username: '8129902',
    personal_number: '8129902',
    full_name: 'יובלי לי',
    role: 'מפקד פלוגת רובוטיקה',
    rank: 'קצין',
    department_id: '03b2c778-b4e6-4ead-9c13-986e7c363bc1', // מחלקה 1
    unique_token: crypto.randomUUID(),
    password: 'yuval669'
  };

  console.log('--- Adding Soldier 8129902 (Yuvali Li) ---');
  const { data, error } = await supabase
    .from('soldiers')
    .insert([soldierData])
    .select();

  if (error) {
    console.error('Error adding soldier:', error);
  } else {
    console.log('Soldier added successfully:', JSON.stringify(data, null, 2));
  }
}

addYuval();
