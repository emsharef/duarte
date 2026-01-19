const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
      -- 1. Add new columns
      alter table public.artists 
      add column if not exists first_name text,
      add column if not exists last_name text,
      add column if not exists company text;

      -- 2. Migrate existing data (fallback to last_name)
      update public.artists 
      set last_name = name 
      where last_name is null;

      -- 3. Drop old column
      alter table public.artists 
      drop column if exists name;
    `;

        await client.query(sql);
        console.log('Phase 4 Migration (Artist Name Split) completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
