const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');
const XLSX = require('xlsx');
const path = require('path');

// Basic env parser
const env = {};
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) {
            const key = k.trim();
            const val = v.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
            env[key] = val;
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

async function addItzhak() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const personal_id = '9124911';
  const full_name = 'יצחק ניסים ביטון';
  const role = 'מטול';
  const rank = 'סמר';
  const password = 'itzhak669';
  const dept_id = '03b2c778-b4e6-4ead-9c13-986e7c363bc1'; // מחלקה 1
  const token = crypto.randomUUID();

  console.log(`--- Checking/Adding Soldier ${personal_id} (${full_name}) ---`);

  // Check if exists
  const { data: existing } = await supabase.from('soldiers').select('id').eq('personal_number', personal_id).single();
  
  let soldierId;
  if (existing) {
    console.log('Soldier already exists with ID:', existing.id);
    soldierId = existing.id;
  } else {
    // Insert soldier
    const { data: newSol, error: solError } = await supabase.from('soldiers').insert([{
      username: personal_id,
      personal_number: personal_id,
      full_name: full_name,
      role: role,
      rank: rank,
      department_id: dept_id,
      unique_token: token,
      password: password
    }]).select().single();

    if (solError) {
      console.error('Error adding soldier:', solError);
      return;
    }
    console.log('Soldier added successfully:', newSol.id);
    soldierId = newSol.id;
  }

  // Check/Add portal
  const { data: existingPortal } = await supabase.from('soldier_portals').select('id').eq('soldier_id', soldierId).single();
  if (!existingPortal) {
    const { error: portalError } = await supabase.from('soldier_portals').insert([{
      soldier_id: soldierId,
      status: 'בפנים',
      equipment: {},
      equipment_list: []
    }]);
    if (portalError) console.error('Error adding portal:', portalError);
    else console.log('Portal added successfully.');
  } else {
    console.log('Portal already exists.');
  }

  // Update Excel alfon.xlsx
  const excelPath = path.join(__dirname, 'src', 'data', 'alfon.xlsx');
  if (fs.existsSync(excelPath)) {
    console.log('Updating alfon.xlsx...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(sheet);
    
    // Check if already in Excel
    const alreadyInExcel = excelData.find(row => String(row['מספר אישי'] || row['ID'] || row['personal_id']) === personal_id);
    
    if (!alreadyInExcel) {
      // Create new row based on typical columns (name, rank, id, role)
      // I'll try to match the column names if possible or just push a best-guess object
      const newRow = {
        'שם מלא': full_name,
        'מספר אישי': personal_id,
        'תפקיד': role,
        'דרגה': rank,
        'מחלקה': 'מחלקה 1'
      };
      excelData.push(newRow);
      const newSheet = XLSX.utils.json_to_sheet(excelData);
      workbook.Sheets[sheetName] = newSheet;
      XLSX.writeFile(workbook, excelPath);
      console.log('alfon.xlsx updated.');
    } else {
      console.log('Soldier already in alfon.xlsx.');
    }
  } else {
    console.log('alfon.xlsx not found at', excelPath);
  }
}

addItzhak();
