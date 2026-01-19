const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
      create table if not exists public.artworks (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users not null,
        title text not null,
        artist_name text not null,
        year_created integer,
        status text default 'Available',
        location text,
        r2_image_key text,
        created_at timestamp with time zone default now()
      );
      
      create index if not exists artworks_artist_idx on public.artworks (artist_name);
      create index if not exists artworks_status_idx on public.artworks (status);
    `;

        await client.query(sql);
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
