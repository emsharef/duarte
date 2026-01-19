const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
      -- Add extended fields to objects table
      ALTER TABLE public.objects
        ADD COLUMN IF NOT EXISTS inventory_number text,
        ADD COLUMN IF NOT EXISTS object_type text,
        ADD COLUMN IF NOT EXISTS medium text,
        ADD COLUMN IF NOT EXISTS edition text,
        ADD COLUMN IF NOT EXISTS signature_info text,
        ADD COLUMN IF NOT EXISTS condition_description text,
        ADD COLUMN IF NOT EXISTS provenance text,
        ADD COLUMN IF NOT EXISTS exhibition_history text,
        ADD COLUMN IF NOT EXISTS is_framed boolean default false,
        ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default now();

      -- Add index for inventory number
      CREATE INDEX IF NOT EXISTS objects_inventory_number_idx ON public.objects (inventory_number);
    `;

        await client.query(sql);
        console.log('Objects extended fields migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
