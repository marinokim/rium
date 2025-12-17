
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log("🛠  Repairing Database Schema...");

        const queries = [
            // Add manufacturer column
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'manufacturer') THEN ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255); END IF; END $$;`,

            // Add origin column
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'origin') THEN ALTER TABLE products ADD COLUMN origin VARCHAR(255); END IF; END $$;`,

            // Add slug column to categories
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN ALTER TABLE categories ADD COLUMN slug VARCHAR(100); UPDATE categories SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')); ALTER TABLE categories ALTER COLUMN slug SET NOT NULL; ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug); END IF; END $$;`,

            // Add is_tax_free
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_tax_free') THEN ALTER TABLE products ADD COLUMN is_tax_free BOOLEAN DEFAULT FALSE; END IF; END $$;`,

            // Add shipping_fee_individual
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_fee_individual') THEN ALTER TABLE products ADD COLUMN shipping_fee_individual INTEGER DEFAULT 0; END IF; END $$;`,

            // Add shipping_fee_carton
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_fee_carton') THEN ALTER TABLE products ADD COLUMN shipping_fee_carton INTEGER DEFAULT 0; END IF; END $$;`,

            // Add product_options
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_options') THEN ALTER TABLE products ADD COLUMN product_options TEXT; END IF; END $$;`,

            // Add model_no
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_no') THEN ALTER TABLE products ADD COLUMN model_no VARCHAR(255); END IF; END $$;`,

            // Add display_order
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'display_order') THEN ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0; END IF; END $$;`,

            // Add product_spec
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_spec') THEN ALTER TABLE products ADD COLUMN product_spec TEXT; END IF; END $$;`,

            // Add is_new
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_new') THEN ALTER TABLE products ADD COLUMN is_new BOOLEAN DEFAULT FALSE; END IF; END $$;`,

            // Add option to carts
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carts' AND column_name = 'option') THEN ALTER TABLE carts ADD COLUMN option VARCHAR(255) DEFAULT ''; END IF; END $$;`,

            // Create proposal_history
            `CREATE TABLE IF NOT EXISTS proposal_history (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR(255), items JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`
        ];

        for (const q of queries) {
            await client.query(q);
        }

        console.log("✅ Schema repair complete!");

    } catch (err) {
        console.error("❌ Schema repair failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
