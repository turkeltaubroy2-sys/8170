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

async function testPersistence() {
    const pn = '9070865'; // Itamar
    console.log('--- Testing Equipment Persistence for', pn, '---');
    
    const { data: soldier } = await supabase.from('soldiers').select('id').eq('personal_number', pn).single();
    if (!soldier) { console.error('Soldier not found'); return; }

    const testEquip = { "massa_90l": true, "kasda": "טקטית" };
    console.log('Saving test equipment:', JSON.stringify(testEquip));

    const { error: upsertError } = await supabase.from('soldier_portals').upsert({
        soldier_id: soldier.id,
        equipment_list: testEquip,
        updated_at: new Date().toISOString()
    }, { onConflict: 'soldier_id' });

    if (upsertError) {
        console.error('Upsert Error:', upsertError);
        return;
    }
    console.log('Upsert successful');

    const { data: portal } = await supabase.from('soldier_portals').select('equipment_list').eq('soldier_id', soldier.id).single();
    console.log('Fetched equipment_list:', JSON.stringify(portal.equipment_list));

    const isMatch = portal.equipment_list.massa_90l === true && portal.equipment_list.kasda === "טקטית";

    if (isMatch) {
        console.log('SUCCESS: Equipment persisted correctly!');
    } else {
        console.log('FAILURE: Persistence mismatch');
    }
}

testPersistence();
