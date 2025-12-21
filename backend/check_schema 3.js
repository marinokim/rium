import pg from 'pg';

const { Client } = pg;
const DB_URL = "postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function checkSchema() {
    const client = new Client({ connectionString: DB_URL });
    try {
        await client.connect();

        const res = await client.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'detail_url';
        `);

        console.log('Schema Info:', res.rows[0]);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
