
import pg from 'pg';
const { Pool } = pg;
const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        const client = await pool.connect();
        const res = await client.query(`SELECT nspname FROM pg_namespace;`);
        console.log("Schemas:", res.rows.map(r => r.nspname));
        client.release();
    } catch (err) { console.error(err); }
    finally { await pool.end(); }
}
run();
