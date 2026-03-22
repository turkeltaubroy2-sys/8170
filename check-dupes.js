const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDuplicates() {
    const { data: soldiers } = await supabase.from('soldiers').select('id, full_name, personal_number, unique_token, username');
    
    const names = {};
    const dupes = [];
    
    soldiers.forEach(s => {
        if (!names[s.full_name]) names[s.full_name] = [];
        names[s.full_name].push(s);
    });
    
    Object.keys(names).forEach(name => {
        if (names[name].length > 1) {
            console.log(`DUPLICATE FOUND: ${name}`);
            console.log(JSON.stringify(names[name], null, 2));
            dupes.push(name);
        }
    });

    if (dupes.length === 0) console.log('No duplicate names found.');
}

checkDuplicates();
