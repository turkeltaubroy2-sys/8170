import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// This runs on the Node side, so we can securely parse the Excel file.
export async function POST(request: Request) {
  try {
    let { personal_number, password, photo_url } = await request.json();
    
    // Normalize personal number: trim and ensure it's a string
    personal_number = personal_number ? String(personal_number).trim() : null;
    console.log('Registration attempt for P.N (normalized):', personal_number);

    if (!personal_number || !password) {
      return NextResponse.json({ error: 'חסרים נתונים' }, { status: 400 });
    }

    // 1. Check if the soldier is already registered (exists AND has a password)
    const { data: existingUser } = await supabase
      .from('soldiers')
      .select('id, password')
      .eq('personal_number', personal_number)
      .maybeSingle();

    console.log('Existing user check result:', existingUser ? `FOUND (id: ${existingUser.id}, password: ${JSON.stringify(existingUser.password)}, type: ${typeof existingUser.password})` : 'NOT FOUND');

    // EXTREMELY DETAILED CHECK - Only block if they have a truthy password that is not the string "null"
    const hasActualPassword = existingUser && existingUser.password && 
                              String(existingUser.password).trim() !== '' && 
                              String(existingUser.password).trim() !== 'null';

    if (hasActualPassword) {
      console.log('User already has a valid password set. Blocking registration.');
      return NextResponse.json({ 
        error: `משתמש זה כבר רשום במערכת (קוד: REG-CONF-01, מ.א: ${personal_number})`,
        debug: { 
          hasExisting: !!existingUser, 
          pwValue: existingUser.password, 
          pwType: typeof existingUser.password,
          hasActualPassword 
        }
      }, { status: 400 });
    }

    // 2. Read the Excel file to find the soldier
    // Using path.resolve with process.cwd() for better reliability on Windows/Next.js
    const projectRoot = process.cwd();
    let filePath = path.join(projectRoot, 'src', 'data', 'alfon.xlsx');
    
    console.log('--- Registration Debug ---');
    console.log('Project Root:', projectRoot);
    console.log('Target File Path:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File not found at src/data, checking root data folder...');
      filePath = path.join(projectRoot, 'data', 'alfon.xlsx');
    }

    if (!fs.existsSync(filePath)) {
      console.error('CRITICAL: alfon.xlsx not found at any known location');
      return NextResponse.json({ error: 'קובץ הנתונים (alfon.xlsx) חסר בשרת. נא לפנות למנהל המערכת.' }, { status: 500 });
    }

    // Direct buffer read to bypass xlsx.readFile access issues
    let workbook;
    try {
      const stats = fs.statSync(filePath);
      console.log('File exists, size:', stats.size, 'bytes');
      console.log('File permissions:', stats.mode.toString(8));
      
      const fileBuffer = fs.readFileSync(filePath);
      workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      console.log('Successfully read workbook using Buffer');
    } catch (readErr) {
      console.error('Error during direct file read:', readErr);
      throw new Error(`שגיאה בגישה לקובץ הנתונים: ${readErr instanceof Error ? readErr.message : 'שגיאה לא ידועה'}`);
    }
    const sheetName = workbook.SheetNames[0];
    const alfonData: Record<string, unknown>[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    // Search for the personal number
    // Some formats might read it as string or number, so we cast to string to verify
    const soldierMeta = alfonData.find((row) => String(row['מ.א']) === String(personal_number));
    console.log('Soldier find result:', soldierMeta ? 'FOUND' : 'NOT FOUND');

    if (!soldierMeta) {
      return NextResponse.json({ error: 'המספר האישי אינו מופיע במאגר הפלוגה. ודא שהוקלד נכון.' }, { status: 404 });
    }

    // 3. Extract metadata
    // We expect: 'שם פרטי', 'שם משפחה', 'מחלקה', 'תפקיד', 'דרגה'
    const fullName = `${soldierMeta['שם פרטי']} ${soldierMeta['שם משפחה']}`.trim();
    const rank = soldierMeta['דרגה'] || 'חייל';
    const role = soldierMeta['תפקיד'] || 'לוחם';
    
    // Convert the department number/name to our DB format
    // In the file it says e.g. "1", "2" under "מחלקה". We need the UUID from the DB.
    let deptName = `מחלקה ${soldierMeta['מחלקה']}`;
    if (!soldierMeta['מחלקה'] || String(soldierMeta['מחלקה']).trim() === '') {
      deptName = 'חפ"ק';
    }

    // Standardize deptName look-up (some might have extra spaces)
    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .ilike('name', deptName)
      .limit(1)
      .maybeSingle();

    const departmentId = department ? department.id : null;

    // 4. Create or update the user in the database
    // We use upsert with onConflict to handle soldiers already in the DB from the Alfon sync
    const { data: newSoldier, error: upsertError } = await supabase
      .from('soldiers')
      .upsert({
        personal_number: String(personal_number),
        password: password,
        full_name: fullName,
        rank: rank,
        role: role,
        department_id: departmentId,
        photo_url: photo_url || null,
        // Only provide a new token if they don't have one (handled by DB default if we omit it for new, 
        // but here we check if they already exist)
        ...(existingUser ? {} : { unique_token: crypto.randomUUID() })
      }, { onConflict: 'personal_number' })
      .select()
      .single();

    console.log('Register successful for:', newSoldier?.full_name);

    if (upsertError) {
      console.error('Error inserting soldier:', upsertError);
      return NextResponse.json({ error: 'שגיאה בשמירת פרטי החייל במסד הנתונים' }, { status: 500 });
    }

    return NextResponse.json({ success: true, soldier: newSoldier }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאת שרת פנימית';
    console.error('Registration API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
