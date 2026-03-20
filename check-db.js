const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
    const { data: deps } = await supabase.from('departments').select('id, name');
    console.log('Departments in DB:', deps);
    
    const { data: soldiers } = await supabase.from('soldiers').select('id, full_name, personal_number').limit(5);
    console.log('Sample Soldiers in DB:', soldiers);
}

checkDB();
