const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
      alter table public.artists 
      add column if not exists birth_year integer,
      add column if not exists death_year integer,
      add column if not exists nationality text,
      add column if not exists website text,
      add column if not exists aka text,
      add column if not exists r2_headshot_key text;
    `;

        await client.query(sql);
        console.log('Phase 3 Migration (Artists) completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
