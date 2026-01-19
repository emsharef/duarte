require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Loans Migration: Loans table and object_loans junction

    const sql = `
      -- ============================================
      -- LOANS TABLE
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.loans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,

        -- Identity
        loan_subject text,
        loan_direction text,         -- 'in' or 'out'

        -- Parties
        borrower_contact_id uuid REFERENCES public.contacts(id),
        lender_contact_id uuid REFERENCES public.contacts(id),

        -- Exhibition (if applicable)
        exhibition_name text,
        venue text,

        -- Dates
        loan_start_date date,
        loan_end_date date,
        actual_return_date date,

        -- Insurance
        insurance_value numeric,
        insurance_policy_id uuid REFERENCES public.insurance_policies(id),

        -- Status
        loan_status text DEFAULT 'Pending',  -- Pending, Active, Returned, Overdue

        -- Currency
        currency text DEFAULT 'USD',

        -- Notes
        notes text,

        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- ============================================
      -- OBJECT LOANS JUNCTION TABLE
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.object_loans (
        object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE,
        loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE,
        loan_value numeric,
        condition_out text,
        condition_in text,
        PRIMARY KEY (object_id, loan_id)
      );

      -- ============================================
      -- INDEXES
      -- ============================================

      CREATE INDEX IF NOT EXISTS loans_user_idx ON public.loans (user_id);
      CREATE INDEX IF NOT EXISTS loans_direction_idx ON public.loans (loan_direction);
      CREATE INDEX IF NOT EXISTS loans_status_idx ON public.loans (loan_status);
      CREATE INDEX IF NOT EXISTS loans_start_date_idx ON public.loans (loan_start_date);
      CREATE INDEX IF NOT EXISTS loans_end_date_idx ON public.loans (loan_end_date);
      CREATE INDEX IF NOT EXISTS loans_borrower_idx ON public.loans (borrower_contact_id);
      CREATE INDEX IF NOT EXISTS loans_lender_idx ON public.loans (lender_contact_id);
      CREATE INDEX IF NOT EXISTS object_loans_object_idx ON public.object_loans (object_id);
      CREATE INDEX IF NOT EXISTS object_loans_loan_idx ON public.object_loans (loan_id);

      -- ============================================
      -- ROW LEVEL SECURITY POLICIES
      -- ============================================

      -- Enable RLS on new tables
      ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.object_loans ENABLE ROW LEVEL SECURITY;

      -- Loans policies
      DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
      CREATE POLICY "Users can view own loans" ON public.loans
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
      CREATE POLICY "Users can insert own loans" ON public.loans
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
      CREATE POLICY "Users can update own loans" ON public.loans
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own loans" ON public.loans;
      CREATE POLICY "Users can delete own loans" ON public.loans
        FOR DELETE USING (auth.uid() = user_id);

      -- Object loans policies (via join to objects)
      DROP POLICY IF EXISTS "Users can view own object_loans" ON public.object_loans;
      CREATE POLICY "Users can view own object_loans" ON public.object_loans
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_loans.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can insert own object_loans" ON public.object_loans;
      CREATE POLICY "Users can insert own object_loans" ON public.object_loans
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_loans.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can update own object_loans" ON public.object_loans;
      CREATE POLICY "Users can update own object_loans" ON public.object_loans
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_loans.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can delete own object_loans" ON public.object_loans;
      CREATE POLICY "Users can delete own object_loans" ON public.object_loans
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_loans.object_id AND objects.user_id = auth.uid())
        );
    `;

    await client.query(sql);
    console.log('Loans migration completed successfully!');

    // Verify new tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('loans', 'object_loans')
      ORDER BY table_name
    `);
    console.log('\nLoan tables created:');
    tables.rows.forEach(r => console.log('  -', r.table_name));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
