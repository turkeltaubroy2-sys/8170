const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');

// Simple env loader
const env = {};
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function sync() {
    try {
        console.log('Reading Excel file...');
        const workbook = xlsx.readFile('C:\\Users\\YaelDrori\\Documents\\roy cv\\אלפון\\Copy of אלפון פלוגה ב - Sheet1.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
        console.log(`Excel has ${excelData.length} rows.`);

        console.log('Fetching current departments...');
        const { data: deps } = await supabase.from('departments').select('id, name');
        const depMap = {};
        deps.forEach(d => depMap[d.name] = d.id);

        console.log('Fetching current soldiers...');
        const { data: existingSoldiers } = await supabase.from('soldiers').select('personal_number');
        const existingPNs = new Set(existingSoldiers.map(s => s.personal_number).filter(Boolean));

        let newCount = 0;
        for (const row of excelData) {
            const personal_number = String(row['מ.א']);
            if (existingPNs.has(personal_number)) continue;

            const fullName = `${row['שם פרטי']} ${row['שם משפחה']}`.trim();
            const depName = `מחלקה ${row['מחלקה']}`;
            
            let department_id = depMap[depName];
            if (!department_id && row['מחלקה']) {
                console.log(`Creating missing department: ${depName}`);
                const { data: newDep, error: depErr } = await supabase.from('departments').insert({ name: depName }).select().single();
                if (depErr) {
                    console.error(`Failed to create department ${depName}:`, depErr.message);
                    continue;
                }
                department_id = newDep.id;
                depMap[depName] = department_id;
            }

            const { error: insErr } = await supabase.from('soldiers').insert({
                full_name: fullName,
                rank: row['דרגה'] || 'טוראי',
                personal_number: personal_number,
                role: row['תפקיד'] || 'לוחם',
                department_id: department_id
            });

            if (insErr) {
                console.error(`Failed to insert ${fullName}:`, insErr.message);
            } else {
                newCount++;
                console.log(`Added: ${fullName} (${personal_number}) to ${depName}`);
            }
        }

        console.log(`--- Sync Summary ---`);
        console.log(`Total new soldiers added: ${newCount}`);
        
    } catch (e) {
        console.error('Error during sync:', e);
    }
}

sync();
