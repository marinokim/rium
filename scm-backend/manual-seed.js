
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    console.log('🌱 Starting manual seeding via pg...');

    try {
        const hashedPassword = await bcrypt.hash('admin1234', 10);
        const partnerPassword = await bcrypt.hash('partner1234', 10);

        // Insert Admin
        // Using ON CONFLICT DO NOTHING to avoid duplicate key errors if run multiple times
        await pool.query(`
      INSERT INTO "User" (email, password, name, company, role, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['admin@rium.co.kr', hashedPassword, 'RIUM Admin', 'RIUM Headquarters', 'ADMIN']);
        console.log('✅ Admin user created/verified');

        // Insert Partner
        await pool.query(`
      INSERT INTO "User" (email, password, name, company, role, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['partner@store.com', partnerPassword, 'Store Partner', 'Lotte Mart Jamsil', 'PARTNER']);
        console.log('✅ Partner user created/verified');

    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        await pool.end();
    }
}

main();
