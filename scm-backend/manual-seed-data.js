
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log("🌱 Seeding Data manually...");

        // 1. Ensure Categories
        const cats = [
            { id: 101, name: 'Consumer Electronics', slug: 'electronics' },
            { id: 102, name: 'Home & Living', slug: 'living' },
            { id: 103, name: 'Food & Beverage', slug: 'food' }
        ];

        for (const c of cats) {
            await client.query(
                `INSERT INTO "Category" (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
                [c.id, c.name, c.slug]
            );
        }
        console.log("✅ Categories seeded");

        // 2. Ensure Products
        const products = [
            { name: 'Smart Air Conditioner', price: 1200000, catId: 101, desc: 'High efficiency AC' },
            { name: 'Wireless Headphones', price: 89000, catId: 101, desc: 'Noise cancelling' },
            { name: 'Organic Coffee Beans', price: 15000, catId: 103, desc: '1kg bag' },
            { name: 'Office Chair', price: 150000, catId: 102, desc: 'Ergonomic design' },
            { name: 'Gaming Monitor', price: 450000, catId: 101, desc: '144Hz IPS Panel' }
        ];

        for (const p of products) {
            await client.query(
                `INSERT INTO "Product" (name, description, price, "categoryId", "imageUrl", "isAvailable", "updatedAt") 
                 VALUES ($1, $2, $3, $4, '', true, NOW()) 
                 ON CONFLICT DO NOTHING`,
                [p.name, p.desc, p.price, p.catId]
            );
        }
        console.log("✅ Products seeded");

        // 3. Ensure Quotes (Linked to Partner)
        // Find Partner ID
        const resUser = await client.query(`SELECT id FROM "User" WHERE email = 'partner@store.com'`);
        if (resUser.rows.length > 0) {
            const partnerId = resUser.rows[0].id;

            // Find Product IDs
            const resProd = await client.query(`SELECT id, price FROM "Product" LIMIT 2`);
            if (resProd.rows.length >= 2) {
                const p1 = resProd.rows[0];
                const p2 = resProd.rows[1];

                const quoteNum = `REQ-${new Date().getFullYear()}1214-001`;

                // Create Quote
                const resQuote = await client.query(
                    `INSERT INTO "Quote" ("quoteNumber", "userId", "status", "totalAmount", "updatedAt")
                     VALUES ($1, $2, 'PENDING', $3, NOW())
                     RETURNING id`,
                    [quoteNum, partnerId, (p1.price * 2) + (p2.price * 5)]
                );

                const quoteId = resQuote.rows[0].id;

                // Create Quote Items
                await client.query(
                    `INSERT INTO "QuoteItem" ("quoteId", "productId", "quantity", "price") VALUES ($1, $2, $3, $4)`,
                    [quoteId, p1.id, 2, p1.price]
                );
                await client.query(
                    `INSERT INTO "QuoteItem" ("quoteId", "productId", "quantity", "price") VALUES ($1, $2, $3, $4)`,
                    [quoteId, p2.id, 5, p2.price]
                );
                console.log("✅ Sample Quote created");
            }
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
