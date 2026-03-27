import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_PASSWORD = 'Tורלקךטשקך998!';
const PROJECT_REF = 'gcsixiixqebbkktarayc';

const UPDATE_SQL = `
ALTER TABLE messages ADD COLUMN IF NOT EXISTS target_soldier_id UUID REFERENCES soldiers(id) ON DELETE CASCADE;
`;

export async function GET() {
  const config = {
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };

  const client = new Client(config);
  try {
    await client.connect();
    await client.query(UPDATE_SQL);
    await client.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully! Added target_soldier_id to messages table.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    try { await client.end(); } catch {}
    return NextResponse.json({
      success: false,
      message: 'Database update failed.',
      error: message,
    }, { status: 500 });
  }
}
