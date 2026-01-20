require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Database cleanup migration
    // Run date: 2026-01-19

    const sql = `
      -- ============================================
      -- 1. Fix loans table column names
      -- Rename columns to match code expectations
      -- ============================================

      ALTER TABLE public.loans
        RENAME COLUMN loan_direction TO direction;
      ALTER TABLE public.loans
        RENAME COLUMN loan_status TO status;
      ALTER TABLE public.loans
        RENAME COLUMN loan_start_date TO start_date;
      ALTER TABLE public.loans
        RENAME COLUMN loan_end_date TO end_date;

      -- ============================================
      -- 2. Drop legacy artworks table
      -- Replaced by objects table
      -- ============================================

      DROP TABLE IF EXISTS public.artworks CASCADE;

      -- ============================================
      -- 3. Remove redundant lot_number from acquisitions
      -- Moved to object-level in object_acquisitions
      -- ============================================

      ALTER TABLE public.acquisitions DROP COLUMN IF EXISTS lot_number;
    `;

    console.log('Running cleanup migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
