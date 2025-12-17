
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT * FROM "User" WHERE email = $1', ['admin@rium.co.kr']);

        if (res.rows.length === 0) {
            console.log("❌ Admin not found");
        } else {
            const user = res.rows[0];
            console.log("Found user. Hashed pass:", user.password);
            const valid = await bcrypt.compare('admin1234', user.password);
            console.log(`✅ Password 'admin1234' is valid? ${valid}`);
        }
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
