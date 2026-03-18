// Script to apply Supabase schema - run from plugah-8170 directory
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gcsixiixqebbkktarayc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ai1PNCShYIekZ951RXiZFw_GxOxlfsB';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE_CHECKS = ['departments', 'soldiers', 'soldier_portals', 'schedules', 'lists', 'list_items', 'logistics', 'media'];

async function checkTable(tableName) {
  const { error } = await supabase.from(tableName).select('*').limit(1);
  if (!error) {
    console.log(`  ✅ '${tableName}' EXISTS`);
    return true;
  } else {
    console.log(`  ❌ '${tableName}' MISSING: ${error.message}`);
    return false;
  }
}

async function seedDepartments() {
  console.log('\n🌱 Seeding departments...');
  const { data: existing } = await supabase.from('departments').select('*');
  if (existing && existing.length > 0) {
    console.log(`  ℹ️  Already has ${existing.length} departments`);
    return;
  }
  const { error } = await supabase.from('departments').insert([
    { name: 'מטה הפלוגה', icon: '⭐', order: 1 },
    { name: 'מחלקה א', icon: '1', order: 2 },
    { name: 'מחלקה ב', icon: '2', order: 3 },
    { name: 'מחלקה ג', icon: '3', order: 4 },
    { name: 'תמיכה', icon: '🔧', order: 5 },
  ]);
  if (error) console.log(`  ❌ Seed error: ${error.message}`);
  else console.log(`  ✅ Departments seeded!`);
}

async function main() {
  console.log('🔍 Checking Supabase tables...\n');
  
  const results = [];
  for (const table of TABLE_CHECKS) {
    const exists = await checkTable(table);
    results.push({ table, exists });
  }
  
  const missing = results.filter(r => !r.exists);
  
  if (missing.length === 0) {
    console.log('\n✅ ALL TABLES EXIST! Seeding data...');
    await seedDepartments();
    console.log('\n🎉 Database is ready!');
  } else {
    console.log(`\n⚠️  ${missing.length} tables missing: ${missing.map(r => r.table).join(', ')}`);
    console.log('\n📋 Please run the SQL schema in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/gcsixiixqebbkktarayc/sql/new');
  }
}

main().catch(console.error);
