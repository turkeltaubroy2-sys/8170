const { Client } = require('pg');

const regions = [
  'aws-0-eu-central-1',
  'aws-0-eu-west-1', 
  'aws-0-eu-west-2',
  'aws-0-eu-west-3',
  'aws-0-us-east-1',
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-ap-northeast-2',
  'aws-0-ap-south-1',
  'aws-0-ap-southeast-2',
  'aws-0-sa-east-1',
  'aws-0-ca-central-1',
  'gcp-0-us-central1'
];

const password = 'Tורלקךטשקך998!';
const user = 'postgres.gcsixiixqebbkktarayc';

async function testRegions() {
  console.log('Testing regions...');
  for (const region of regions) {
    const host = `${region}.pooler.supabase.com`;
    const client = new Client({
      host,
      port: 5432,
      database: 'postgres',
      user: user,
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });
    
    try {
      await client.connect();
      console.log('SUCCESS with region:', region);
      await client.end();
      return region;
    } catch (e) {
      if (!e.message.includes('Tenant or user not found')) {
        console.log(`${region} -> ${e.message}`);
      }
    }
  }
  console.log('No region worked.');
}

testRegions();
