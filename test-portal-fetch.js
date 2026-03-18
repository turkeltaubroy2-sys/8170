require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetch() {
  // 1. Get Roei's token (Simulating login)
  const { data: loginData, error: loginError } = await supabase
    .from('soldiers')
    .select('*')
    .eq('username', 'roei')
    .single();
    
  if (loginError) {
    console.error("Login Query Error:", loginError);
    return;
  }
  
  console.log("Found Roei's Token:", loginData.unique_token);
  
  // 2. Simulate the portal page fetch
  const { data, error } = await supabase
    .from('soldiers')
    .select('*, departments(name,icon)')
    .eq('unique_token', loginData.unique_token)
    .single();
    
  if (error) {
    console.error("Portal Fetch Error:", error);
  } else {
    console.log("Portal Fetch Success! Data:", data);
  }
}

testFetch();
