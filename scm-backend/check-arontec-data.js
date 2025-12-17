
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log("🔍 Checking 'users' table...");
        const resUsers = await client.query('SELECT id, email, company_name FROM users');
        if (resUsers.rows.length === 0) console.log("⚠️ Users table is EMPTY.");
        else console.table(resUsers.rows);

        console.log("\n🔍 Checking 'products' table...");
        const resProducts = await client.query('SELECT id, brand, model_name, b2b_price FROM products');
        if (resProducts.rows.length === 0) console.log("⚠️ Products table is EMPTY.");
        else console.table(resProducts.rows);

    } catch (err) {
        console.error("❌ Error checking data:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
