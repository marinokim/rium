import pg from 'pg';
const { Client } = pg;

// Configuration
const SOURCE_DB_URL = "postgresql://postgres.zgqnhbaztgpekerhxwbc:tvUanxqfZgfycusR@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";
const TARGET_DB_URL = "postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function migrate() {
    const sourceClient = new Client({ connectionString: SOURCE_DB_URL });
    const targetClient = new Client({ connectionString: TARGET_DB_URL });

    try {
        console.log('Connecting to databases...');
        await sourceClient.connect();
        await targetClient.connect();
        console.log('Connected!');

        // 1. Migrate Categories (Required for Foreign Keys)
        console.log('Migrating Categories...');
        const cats = await sourceClient.query('SELECT * FROM categories');

        for (const cat of cats.rows) {
            // Upsert Category
            // We preserve ID to keep relationships intact if possible, or mapping is needed.
            // Simplest: Try to insert with ID. If conflict on ID, do nothing (assume existing is same structure or compatible).
            // Better: ON CONFLICT (id) DO UPDATE
            try {
                await targetClient.query(`
                    INSERT INTO categories (id, name, slug, description, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE 
                    SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description
                `, [cat.id, cat.name, cat.slug, cat.description, cat.created_at]);
            } catch (err) {
                // Try ignoring unique constraint on ID if schema doesn't allow upsert easily?
                // Or maybe conflict on SLUG?
                // Let's rely on ID first.
                console.warn(`Skipping/Error category ${cat.name}:`, err.message);
            }
        }
        console.log(`Synced ${cats.rows.length} categories.`);

        // 2. Migrate Products (Limit 100)
        console.log('Migrating Products (Limit 100)...');
        const prods = await sourceClient.query('SELECT * FROM products ORDER BY id DESC LIMIT 100'); // Get latest

        let successCount = 0;
        for (const p of prods.rows) {
            try {
                // Upsert Product
                await targetClient.query(`
                    INSERT INTO products (id, category_id, brand, model_name, description, image_url, b2b_price, stock_quantity, is_available, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (id) DO UPDATE
                    SET category_id = EXCLUDED.category_id,
                        brand = EXCLUDED.brand,
                        model_name = EXCLUDED.model_name,
                        b2b_price = EXCLUDED.b2b_price
                `, [p.id, p.category_id, p.brand, p.model_name, p.description, p.image_url, p.b2b_price, p.stock_quantity, p.is_available, p.created_at]);
                successCount++;
            } catch (err) {
                console.error(`Failed to migrate product ${p.model_name}:`, err.message);
            }
        }

        console.log(`Successfully migrated ${successCount} products.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sourceClient.end();
        await targetClient.end();
    }
}

migrate();
