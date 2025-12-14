
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log('🔍 Checking login credentials...');

    try {
        const email = 'admin@rium.co.kr';
        const inputPassword = 'admin1234';

        console.log(`Attempting login for: ${email}`);

        // 1. Check if user exists
        const res = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.error('❌ User not found!');
            return;
        }

        const user = res.rows[0];
        console.log(`✅ User found: ID=${user.id}, Role=${user.role}`);

        // 2. Check password
        const isMatch = await bcrypt.compare(inputPassword, user.password);

        if (isMatch) {
            console.log('✅ Password Match! Login successful.');
        } else {
            console.error('❌ Password Mismatch!');
            console.log('Stored Hash:', user.password);
        }

    } catch (err) {
        console.error('❌ Database connection error:', err);
    } finally {
        pool.end();
    }
}

main();
