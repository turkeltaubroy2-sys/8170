import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';
import path from 'path';

// This runs on the Node side, so we can securely parse the Excel file.
export async function POST(request: Request) {
  try {
    const { personal_number, password } = await request.json();

    if (!personal_number || !password) {
      return NextResponse.json({ error: 'חסרים נתונים' }, { status: 400 });
    }

    // 1. Check if the soldier is already registered
    const { data: existingUser } = await supabase
      .from('soldiers')
      .select('id')
      .eq('personal_number', personal_number)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'משתמש זה כבר רשום במערכת' }, { status: 400 });
    }

    // 2. Read the Excel file to find the soldier
    // Using path.join with process.cwd() works natively in Next.js Server Actions/API routes
    const filePath = path.join(process.cwd(), 'src', 'data', 'alfon.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const alfonData: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    // Search for the personal number
    // Some formats might read it as string or number, so we cast to string to verify
    const soldierMeta = alfonData.find((row: any) => String(row['מ.א']) === String(personal_number));

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
      deptName = 'חפ"ק'; // Generic default or maybe from 'תפקיד'
    }

    // Fetch department ID
    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('name', deptName)
      .single();

    const departmentId = department ? department.id : null;

    // 4. Create the user in the database
    const { data: newSoldier, error: insertError } = await supabase
      .from('soldiers')
      .insert({
        personal_number: String(personal_number),
        password: password,
        full_name: fullName,
        rank: rank,
        role: role,
        department_id: departmentId,
        unique_token: crypto.randomUUID()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting soldier:', insertError);
      return NextResponse.json({ error: 'שגיאה בשמירת פרטי החייל במסד הנתונים' }, { status: 500 });
    }

    return NextResponse.json({ success: true, soldier: newSoldier }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: error.message || 'שגיאת שרת פנימית' }, { status: 500 });
  }
}
