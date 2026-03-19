import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase. For this API route, we use the service role key to bypass RLS securely if needed,
// but the Anon Key is also fine since we just query. 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'חסרים פרטי התחברות' }, { status: 400 });
    }

    // Role-based logic: Hardcoded admin
    if (username === 'Admin' && (password === 'admin' || password === 'admin123')) {
      return NextResponse.json({ 
        success: true, 
        role: 'admin',
        token: 'admin-token',
        name: 'מנהל מערכת'
      });
    }

    // Soldier login
    // Try by personal_number first, fallback to username for legacy
    const { data: byPersonal } = await supabase
      .from('soldiers')
      .select('id, full_name, unique_token, password, department_id')
      .eq('personal_number', username)
      .single();
      
    let data;
    if (byPersonal) {
      data = byPersonal;
    } else {
      const { data: byUser, error } = await supabase
        .from('soldiers')
        .select('id, full_name, unique_token, password, department_id')
        .eq('username', username)
        .single();
      
      if (error || !byUser) {
        return NextResponse.json({ error: 'מספר אישי או שם משתמש לא קיים' }, { status: 401 });
      }
      data = byUser;
    }

    if (data.password !== password) {
      return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      role: 'soldier',
      token: data.unique_token,
      name: data.full_name
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}
