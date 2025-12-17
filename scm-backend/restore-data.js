
import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

// Connection
const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

// Data Sources (Hardcoded from file reads for simplicity in this script context)
const categories = [
    { "id": 1, "name": "Audio", "slug": "audio" },
    { "id": 2, "name": "Mobile", "slug": "mobile" },
    { "id": 3, "name": "Beauty", "slug": "beauty" },
    { "id": 4, "name": "Lifestyle", "slug": "lifestyle" },
    { "id": 103, "name": "Food", "slug": "food" } // Added to support "Food" category in products
];

const products = [
    {
        "id": 1, "name": "Premium Rose Facial Serum", "brand": "RIUM Beauty", "desc": "Revitalize your skin with our organic rose serum. Rich in vitamins and antioxidants.",
        "price": 45000, "category": "Beauty", "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1887&auto=format&fit=crop"
    },
    {
        "id": 2, "name": "Hydrating Daily Moisturizer", "brand": "Pure Skin", "desc": "Lightweight and deeply hydrating. Perfect for daily use on all skin types.",
        "price": 32000, "category": "Beauty", "image": "https://images.unsplash.com/photo-1556228720-1957be83f315?q=80&w=1887&auto=format&fit=crop"
    },
    {
        "id": 3, "name": "Organic Granola Mix", "brand": "Nature Food", "desc": "A healthy blend of oats, nuts, and honey. Perfect for breakfast or snacking.",
        "price": 12000, "category": "Food", "image": "https://images.unsplash.com/photo-1517093700877-5b331d6d9e96?q=80&w=1887&auto=format&fit=crop"
    },
    {
        "id": 4, "name": "Premium Olive Oil Set", "brand": "Fresh Table", "desc": "Extra virgin olive oil cold-pressed from the finest olives.",
        "price": 55000, "category": "Food", "image": "https://images.unsplash.com/photo-1474979266404-7cadd9162e7f?q=80&w=2070&auto=format&fit=crop"
    },
    {
        "id": 5, "name": "Minimalist Ceramic Vase", "brand": "Modern Living", "desc": "Elegant ceramic vase to enhance your home decor. Handcrafted design.",
        "price": 28000, "category": "Lifestyle", "image": "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=2070&auto=format&fit=crop"
    },
    {
        "id": 6, "name": "Soft Cotton Throw Blanket", "brand": "Cozy Home", "desc": "Luxuriously soft cotton throw for your sofa or bed. Available in neutral tones.",
        "price": 35000, "category": "Lifestyle", "image": "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?q=80&w=2070&auto=format&fit=crop"
    },
    {
        "id": 7, "name": "Vitamin C Brightening Mask", "brand": "RIUM Beauty", "desc": "Instant glow and hydration. Pack of 5 sheet masks.",
        "price": 15000, "category": "Beauty", "image": "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=1887&auto=format&fit=crop"
    },
    {
        "id": 8, "name": "Raw Honey Jar", "brand": "Nature Food", "desc": "100% pure raw honey. Natural sweetener with health benefits.",
        "price": 18000, "category": "Food", "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1780&auto=format&fit=crop"
    }
];

async function run() {
    const client = await pool.connect();
    try {
        console.log("♻️  Restoring Data from Local Backups...");

        // 1. Categories
        for (const c of categories) {
            await client.query(
                `INSERT INTO "Category" (id, name, slug) VALUES ($1, $2, $3) 
                 ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug`,
                [c.id, c.name, c.slug]
            );
        }
        console.log(`✅ Categories restored (${categories.length})`);

        // 2. Products
        for (const p of products) {
            // Find Category ID
            let catId = 1; // Default
            const cat = categories.find(c => c.slug === p.category.toLowerCase() || c.name === p.category);
            if (cat) catId = cat.id;

            await client.query(
                `INSERT INTO "Product" (id, name, description, price, "categoryId", "imageUrl", "isAvailable", "updatedAt") 
                 VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) 
                 ON CONFLICT (id) DO UPDATE SET 
                    name=EXCLUDED.name, description=EXCLUDED.description, price=EXCLUDED.price, 
                    "categoryId"=EXCLUDED."categoryId", "imageUrl"=EXCLUDED."imageUrl"`,
                [p.id, p.name, p.desc, p.price, catId, p.image]
            );
        }
        console.log(`✅ Products restored (${products.length})`);

    } catch (err) {
        console.error("❌ Restore Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
