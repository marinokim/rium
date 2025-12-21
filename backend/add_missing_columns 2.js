import pg from 'pg';

const { Client } = pg;
const DB_URL = "postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function runMigration() {
    const client = new Client({ connectionString: DB_URL });
    try {
        await client.connect();
        console.log('Connected to DB. Adding missing columns...');

        const columns = [
            "ADD COLUMN IF NOT EXISTS detail_url TEXT",
            "ADD COLUMN IF NOT EXISTS consumer_price DECIMAL(12, 2) DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS supply_price DECIMAL(12, 2) DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS quantity_per_carton INTEGER DEFAULT 1",
            "ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS origin VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS is_tax_free BOOLEAN DEFAULT FALSE",
            "ADD COLUMN IF NOT EXISTS shipping_fee_individual DECIMAL(10, 2) DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS shipping_fee_carton DECIMAL(10, 2) DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS product_options TEXT",
            "ADD COLUMN IF NOT EXISTS model_no VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS product_spec TEXT",
            "ADD COLUMN IF NOT EXISTS remarks TEXT",
            "ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE"
        ];

        for (const col of columns) {
            try {
                await client.query(`ALTER TABLE products ${col};`);
                console.log(`Executed: ${col}`);
            } catch (e) {
                console.error(`Failed: ${col}`, e.message);
            }
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
