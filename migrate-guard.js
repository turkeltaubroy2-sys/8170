const https = require('https');

const PROJECT_REF = 'gcsixiixqebbkktarayc';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjc2l4aWl4cWViYmtrdGFyYXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg0MTUzMywiZXhwIjoyMDg5NDE3NTMzfQ.o2MknhyyoVkaAh5n3t8KJy0_LyOXJKTuL_bV1msFHZg';

const SQL = `
ALTER TABLE guard_events ADD COLUMN IF NOT EXISTS target_status TEXT DEFAULT 'all';
ALTER TABLE guard_shifts ADD COLUMN IF NOT EXISTS requested_by_id UUID REFERENCES soldiers(id);
`;

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE,
    'Authorization': `Bearer ${SERVICE_ROLE}`,
  };

  const endpoints = [
    { url: `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/query`, body: JSON.stringify({ query: SQL }) },
    { url: `https://${PROJECT_REF}.supabase.co/pg/query`,          body: JSON.stringify({ query: SQL }) },
    { url: `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec`,  body: JSON.stringify({ sql: SQL }) },
  ];

  for (const { url, body } of endpoints) {
    try {
      const urlObj = new URL(url);
      const res = await request(urlObj, {
        method: 'POST',
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
      }, body);
      console.log(`\n▶ ${url}`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Body: ${res.body.slice(0, 300)}`);
      if (res.status === 200 || res.status === 204) {
        console.log("Migration successful!");
        break;
      }
    } catch (e) {
      console.log(`\n▶ ${url}`);
      console.log(`  Error: ${e.message}`);
    }
  }
}

main();
