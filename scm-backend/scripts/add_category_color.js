import pool from '../config/database.js';

const COLOR_MAP = {
    'audio': '#FF5733',       // Orange-Red
    'mobile': '#3498DB',      // Blue
    'beauty': '#E91E63',      // Pink
    'living': '#2ECC71',      // Green
    'electronics': '#9B59B6', // Purple
    'gift-set': '#F1C40F',    // Yellow
    'gift set': '#F1C40F'     // Handle variation
};

async function migrateCategoryColors() {
    const client = await pool.connect();
    try {
        console.log('BEGIN: Adding color column to categories...');
        await client.query('BEGIN');

        // 1. Add column if not exists
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#333333'
        `);
        console.log('Column "color" added/verified.');

        // 2. Update existing categories with default colors
        const categories = await client.query('SELECT * FROM categories');

        for (const cat of categories.rows) {
            const slug = cat.slug;
            const name = cat.name.toLowerCase();

            let color = '#333333';
            if (COLOR_MAP[slug]) {
                color = COLOR_MAP[slug];
            } else if (COLOR_MAP[name]) {
                color = COLOR_MAP[name];
            }

            // Check specific known IDs if name/slug fails
            if (cat.name === 'Gift Set') color = '#F1C40F';

            console.log(`Updating ${cat.name} (${cat.slug}) -> ${color}`);
            await client.query('UPDATE categories SET color = $1 WHERE id = $2', [color, cat.id]);
        }

        await client.query('COMMIT');
        console.log('SUCCESS: Migration complete.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR: Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateCategoryColors();
