const URL = 'https://gcsixiixqebbkktarayc.supabase.co';
const KEY = 'sb_publishable_ai1PNCShYIekZ951RXiZFw_GxOxlfsB';

async function run() {
  const req = await fetch(`${URL}/rest/v1/departments?select=id&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
  });
  const deps = await req.json();
  const depId = deps.length > 0 ? deps[0].id : null;

  // Insert or update
  const getSoldier = await fetch(`${URL}/rest/v1/soldiers?username=eq.8075039&select=id`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
  });
  const ex = await getSoldier.json();

  if (ex && ex.length > 0) {
    await fetch(`${URL}/rest/v1/soldiers?id=eq.${ex[0].id}`, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'turkeltaub998!' })
    });
    console.log('Updated user 8075039');
  } else {
    await fetch(`${URL}/rest/v1/soldiers`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '8075039',
        password: 'turkeltaub998!',
        full_name: 'רועי טורקלטאוב',
        rank: 'רס"ר',
        role: 'סגל',
        department_id: depId,
        unique_token: crypto.randomUUID()
      })
    });
    console.log('Inserted user 8075039');
  }
}
run();
