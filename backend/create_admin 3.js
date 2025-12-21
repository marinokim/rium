import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

// Target Rium DB (ap-south-1)
const DB_URL = "postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function createAdmin() {
    const client = new Client({ connectionString: DB_URL });

    try {
        await client.connect();

        const email = 'admin@rium.co.kr';
        const password = 'admin1234';

        console.log(`Hashing password for ${email}...`);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log('Inserting/Updating user...');

        // Upsert logic
        const query = `
            INSERT INTO users (email, password_hash, company_name, contact_person, phone, is_approved, is_admin)
            VALUES ($1, $2, 'Rium HQ', 'Admin', '010-0000-0000', true, true)
            ON CONFLICT (email) 
            DO UPDATE SET 
                password_hash = EXCLUDED.password_hash,
                is_admin = true,
                is_approved = true;
        `;

        await client.query(query, [email, hash]);

        console.log('Success! Admin user created/updated.');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (err) {
        console.error('Failed to create admin:', err);
    } finally {
        await client.end();
    }
}

createAdmin();
