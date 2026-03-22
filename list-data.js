const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Basic env parser
const env = {};
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    console.log('--- Sample Soldiers ---');
    const { data: soldiers } = await supabase.from('soldiers').select('id, full_name, personal_number, unique_token').limit(20);
    console.log(JSON.stringify(soldiers, null, 2));
}

inspect();
