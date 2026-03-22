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

async function checkAndFix() {
    console.log('--- Detailed Check for Itamar Hartuv ---');
    const { data: soldiers, error } = await supabase
        .from('soldiers')
        .select('*')
        .eq('personal_number', '9070865');
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Found soldiers count:', soldiers.length);
    if (soldiers.length === 0) {
        console.log('No soldier found with P.N 9070865');
        return;
    }

    const s = soldiers[0];
    console.log('Full Name:', s.full_name);
    console.log('Password Value:', JSON.stringify(s.password));
    console.log('Password Type:', typeof s.password);
    
    if (s.password && s.password.trim() !== '') {
        console.log('Soldier HAS a password. Resetting it to null to allow registration...');
        const { error: updateError } = await supabase
            .from('soldiers')
            .update({ password: null })
            .eq('id', s.id);
        
        if (updateError) {
            console.error('Update Error:', updateError);
        } else {
            console.log('Password reset successfully.');
        }
    } else {
        console.log('Soldier does NOT have a password (is null or empty). Registration SHOULD work.');
    }
}

checkAndFix();
