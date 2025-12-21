import pool from './config/database.js';

const migrate = async () => {
    try {
        await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#ffffff';");
        console.log("Migration successful: Added color column to categories.");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
};

migrate();
