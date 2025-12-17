
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Use absolute path to the dump file
const DUMP_PATH = '/Users/lab/Desktop/Worktemp/arontec-scm/backend/database_dump.sql';
const CONNECTION_STRING = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function restore() {
    const client = await pool.connect();
    try {
        console.log("📖 Reading dump file...");
        let sql = fs.readFileSync(DUMP_PATH, 'utf8');

        console.log("🧹 Transforming COPY statements to INSERTs...");

        // Regex to find COPY blocks
        // COPY public.carts (id, ...) FROM stdin;
        // data lines...
        // \.
        const copyRegex = /COPY ([\w\.]+) \((.*?)\) FROM stdin;([\s\S]*?)\\\./g;

        sql = sql.replace(copyRegex, (match, tableName, columns, dataBlock) => {
            const rows = dataBlock.trim().split('\n').filter(line => line.length > 0);
            if (rows.length === 0) return '';

            const cols = columns.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

            const insertStatements = rows.map(row => {
                const values = row.split('\t').map(val => {
                    if (val === '\\N') return 'NULL';
                    // Escape single quotes for SQL
                    return `'${val.replace(/'/g, "''")}'`;
                });
                return `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')});`;
            }).join('\n');

            return `-- Replaced COPY for ${tableName}\n${insertStatements}`;
        });

        // Remove lines starting with '\' (psql meta-commands)
        // Also remove OWNER TO statements which cause errors if role doesn't exist
        sql = sql.split('\n').filter(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('\\')) return false;
            if (trimmed.startsWith('ALTER') && trimmed.includes('OWNER TO')) return false;
            return true;
        }).join('\n');


        console.log("💣 Resetting Schema...");
        await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
        await client.query('CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');

        console.log("🚀 Executing SQL Dump...");
        await client.query(sql);

        console.log("✅ Restore Completed Successfully!");

    } catch (err) {
        console.error("❌ Restore Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

restore();
