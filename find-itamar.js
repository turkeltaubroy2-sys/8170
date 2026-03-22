const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Basic env parser
const env = {};
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findSoldier() {
    console.log('--- Searching for Itamar ---');
    const { data: soldiers, error } = await supabase
        .from('soldiers')
        .select('id, full_name, personal_number, password, unique_token')
        .or('full_name.ilike.%איתמר%,full_name.ilike.%הרטוב%');
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log(JSON.stringify(soldiers, null, 2));
}

findSoldier();
