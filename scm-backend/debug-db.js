
import pg from 'pg';
const { Pool } = pg;

// Use the URL EXACTLY as we advised the user to set it (Encoded)
const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

async function run() {
    try {
        console.log("1. Connecting to DB...");
        const client = await pool.connect();
        console.log("✅ Connected!");

        console.log("2. Checking User table...");
        const res = await client.query('SELECT * FROM "User"'); // Quoted for case sensitivity
        console.log(`✅ Found ${res.rows.length} users.`);

        if (res.rows.length > 0) {
            console.log("Users:", res.rows.map(u => `${u.email} (${u.role})`));
        } else {
            console.log("❌ Table is empty! Seeding needed.");
        }

        client.release();
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

run();
