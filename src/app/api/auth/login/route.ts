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

    // Since we don't have built-in hashing yet for this simplified quick approach, we check plaintext.
    // In production, passwords should be hashed (e.g., bcrypt)
    const { data, error } = await supabase
      .from('soldiers')
      .select('id, full_name, unique_token, password')
      .eq('username', username)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'שם משתמש לא קיים' }, { status: 401 });
    }

    if (data.password !== password) {
      return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 });
    }

    // Success - return the token
    return NextResponse.json({ 
      success: true, 
      token: data.unique_token,
      name: data.full_name
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}
