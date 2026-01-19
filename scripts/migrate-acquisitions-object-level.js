require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Migration: Move financial fields to object_acquisitions for per-object tracking

    const sql = `
      -- ============================================
      -- Add columns to object_acquisitions for per-object financial tracking
      -- ============================================

      ALTER TABLE public.object_acquisitions
        ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS buyer_premium numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS taxes numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lot_number text,
        ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

      -- ============================================
      -- Add exchange rate field to acquisitions for currency conversion
      -- ============================================

      ALTER TABLE public.acquisitions
        ADD COLUMN IF NOT EXISTS exchange_rate numeric,
        ADD COLUMN IF NOT EXISTS base_currency text DEFAULT 'USD';

      -- Note: acquisition_price, acquisition_discount, buyer_premium, taxes, total_cost
      -- are kept on acquisitions table for backwards compatibility but will be calculated
      -- from object_acquisitions going forward.
    `;

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
