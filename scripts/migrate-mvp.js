require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // MVP Migration: Enhanced Objects, Contacts, Acquisitions, Insurance, Valuations

    const sql = `
      -- ============================================
      -- PHASE 1: Enhanced Object Fields
      -- ============================================

      -- Add new columns to objects table
      ALTER TABLE public.objects
        ADD COLUMN IF NOT EXISTS inventory_number text,
        ADD COLUMN IF NOT EXISTS object_type text,
        ADD COLUMN IF NOT EXISTS medium text,
        ADD COLUMN IF NOT EXISTS edition text,
        ADD COLUMN IF NOT EXISTS signature_info text,
        ADD COLUMN IF NOT EXISTS inscription text,
        ADD COLUMN IF NOT EXISTS provenance text,
        ADD COLUMN IF NOT EXISTS condition_summary text,
        ADD COLUMN IF NOT EXISTS frame_condition text,
        ADD COLUMN IF NOT EXISTS permanent_location_id uuid REFERENCES public.locations(id),
        ADD COLUMN IF NOT EXISTS location_status text DEFAULT 'Unverified',
        ADD COLUMN IF NOT EXISTS object_status text DEFAULT 'Current',
        ADD COLUMN IF NOT EXISTS is_insured boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
        ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

      -- Create unique index on inventory_number per user
      CREATE UNIQUE INDEX IF NOT EXISTS objects_inventory_number_user_idx
        ON public.objects (user_id, inventory_number)
        WHERE inventory_number IS NOT NULL;

      -- ============================================
      -- PHASE 2: Contacts Table
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.contacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,

        -- Type
        contact_type text,

        -- Name
        first_name text,
        last_name text,
        company_name text,
        display_name text,

        -- Contact Info
        email text,
        phone text,
        mobile text,
        website text,

        -- Address
        address_line1 text,
        address_line2 text,
        city text,
        state text,
        postal_code text,
        country text,

        -- Notes
        notes text,

        -- Status
        is_active boolean DEFAULT true,

        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- Indexes for contacts
      CREATE INDEX IF NOT EXISTS contacts_user_idx ON public.contacts (user_id);
      CREATE INDEX IF NOT EXISTS contacts_type_idx ON public.contacts (contact_type);
      CREATE INDEX IF NOT EXISTS contacts_company_idx ON public.contacts (company_name);

      -- ============================================
      -- PHASE 3: Acquisitions
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.acquisitions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,

        -- Identity
        acquisition_subject text,
        acquisition_date date,

        -- Source
        acquired_from_contact_id uuid REFERENCES public.contacts(id),
        acquisition_type text,

        -- Buyer
        bought_by_contact_id uuid REFERENCES public.contacts(id),

        -- Financial
        acquisition_price numeric,
        currency text DEFAULT 'USD',
        acquisition_discount numeric,
        buyer_premium numeric,
        taxes numeric,
        total_cost numeric,

        -- Documentation
        invoice_number text,
        invoice_date date,
        lot_number text,

        -- Notes
        notes text,

        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- Link objects to acquisitions
      CREATE TABLE IF NOT EXISTS public.object_acquisitions (
        object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE,
        acquisition_id uuid REFERENCES public.acquisitions(id) ON DELETE CASCADE,
        object_price numeric,
        PRIMARY KEY (object_id, acquisition_id)
      );

      -- Indexes for acquisitions
      CREATE INDEX IF NOT EXISTS acquisitions_user_idx ON public.acquisitions (user_id);
      CREATE INDEX IF NOT EXISTS acquisitions_date_idx ON public.acquisitions (acquisition_date);
      CREATE INDEX IF NOT EXISTS object_acquisitions_object_idx ON public.object_acquisitions (object_id);
      CREATE INDEX IF NOT EXISTS object_acquisitions_acquisition_idx ON public.object_acquisitions (acquisition_id);

      -- ============================================
      -- PHASE 4: Insurance Policies
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.insurance_policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,

        -- Identity
        policy_subject text,
        policy_number text,

        -- Insurer
        insurer_contact_id uuid REFERENCES public.contacts(id),

        -- Coverage Period
        start_date date,
        end_date date,

        -- Coverage
        coverage_type text,
        total_coverage numeric,
        deductible numeric,
        premium numeric,
        currency text DEFAULT 'USD',

        -- Notes
        notes text,

        is_active boolean DEFAULT true,

        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- Link objects to insurance policies
      CREATE TABLE IF NOT EXISTS public.object_insurance (
        object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE,
        policy_id uuid REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
        insured_value numeric,
        PRIMARY KEY (object_id, policy_id)
      );

      -- Indexes for insurance
      CREATE INDEX IF NOT EXISTS insurance_policies_user_idx ON public.insurance_policies (user_id);
      CREATE INDEX IF NOT EXISTS insurance_policies_active_idx ON public.insurance_policies (is_active);
      CREATE INDEX IF NOT EXISTS object_insurance_object_idx ON public.object_insurance (object_id);
      CREATE INDEX IF NOT EXISTS object_insurance_policy_idx ON public.object_insurance (policy_id);

      -- ============================================
      -- PHASE 5: Valuations
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.valuations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,

        -- Identity
        valuation_subject text,
        valuation_date date,
        valuation_status text DEFAULT 'Pending',

        -- Appraiser
        appraiser_contact_id uuid REFERENCES public.contacts(id),

        -- Type
        value_type text,

        -- Totals
        total_value numeric,
        currency text DEFAULT 'USD',

        -- Notes
        notes text,

        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- Link objects to valuations with individual values
      CREATE TABLE IF NOT EXISTS public.object_valuations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE,
        valuation_id uuid REFERENCES public.valuations(id) ON DELETE CASCADE,

        appraised_value numeric,
        low_estimate numeric,
        high_estimate numeric,

        notes text,

        created_at timestamp with time zone DEFAULT now()
      );

      -- Indexes for valuations
      CREATE INDEX IF NOT EXISTS valuations_user_idx ON public.valuations (user_id);
      CREATE INDEX IF NOT EXISTS valuations_date_idx ON public.valuations (valuation_date);
      CREATE INDEX IF NOT EXISTS valuations_status_idx ON public.valuations (valuation_status);
      CREATE INDEX IF NOT EXISTS object_valuations_object_idx ON public.object_valuations (object_id);
      CREATE INDEX IF NOT EXISTS object_valuations_valuation_idx ON public.object_valuations (valuation_id);

      -- ============================================
      -- PHASE 6: Expenses (Simple tracking)
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.expenses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,
        object_id uuid REFERENCES public.objects(id) ON DELETE CASCADE,

        expense_type text,
        expense_date date,
        vendor_contact_id uuid REFERENCES public.contacts(id),

        amount numeric,
        currency text DEFAULT 'USD',

        description text,
        invoice_number text,

        created_at timestamp with time zone DEFAULT now()
      );

      -- Indexes for expenses
      CREATE INDEX IF NOT EXISTS expenses_user_idx ON public.expenses (user_id);
      CREATE INDEX IF NOT EXISTS expenses_object_idx ON public.expenses (object_id);
      CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses (expense_date);

      -- ============================================
      -- ROW LEVEL SECURITY POLICIES
      -- ============================================

      -- Enable RLS on new tables
      ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.acquisitions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.object_acquisitions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.object_insurance ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.object_valuations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

      -- Contacts policies
      DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
      CREATE POLICY "Users can view own contacts" ON public.contacts
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
      CREATE POLICY "Users can insert own contacts" ON public.contacts
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
      CREATE POLICY "Users can update own contacts" ON public.contacts
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
      CREATE POLICY "Users can delete own contacts" ON public.contacts
        FOR DELETE USING (auth.uid() = user_id);

      -- Acquisitions policies
      DROP POLICY IF EXISTS "Users can view own acquisitions" ON public.acquisitions;
      CREATE POLICY "Users can view own acquisitions" ON public.acquisitions
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own acquisitions" ON public.acquisitions;
      CREATE POLICY "Users can insert own acquisitions" ON public.acquisitions
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own acquisitions" ON public.acquisitions;
      CREATE POLICY "Users can update own acquisitions" ON public.acquisitions
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own acquisitions" ON public.acquisitions;
      CREATE POLICY "Users can delete own acquisitions" ON public.acquisitions
        FOR DELETE USING (auth.uid() = user_id);

      -- Object acquisitions policies (via join to objects)
      DROP POLICY IF EXISTS "Users can view own object_acquisitions" ON public.object_acquisitions;
      CREATE POLICY "Users can view own object_acquisitions" ON public.object_acquisitions
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_acquisitions.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can insert own object_acquisitions" ON public.object_acquisitions;
      CREATE POLICY "Users can insert own object_acquisitions" ON public.object_acquisitions
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_acquisitions.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can delete own object_acquisitions" ON public.object_acquisitions;
      CREATE POLICY "Users can delete own object_acquisitions" ON public.object_acquisitions
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_acquisitions.object_id AND objects.user_id = auth.uid())
        );

      -- Insurance policies RLS
      DROP POLICY IF EXISTS "Users can view own insurance_policies" ON public.insurance_policies;
      CREATE POLICY "Users can view own insurance_policies" ON public.insurance_policies
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own insurance_policies" ON public.insurance_policies;
      CREATE POLICY "Users can insert own insurance_policies" ON public.insurance_policies
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own insurance_policies" ON public.insurance_policies;
      CREATE POLICY "Users can update own insurance_policies" ON public.insurance_policies
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own insurance_policies" ON public.insurance_policies;
      CREATE POLICY "Users can delete own insurance_policies" ON public.insurance_policies
        FOR DELETE USING (auth.uid() = user_id);

      -- Object insurance policies
      DROP POLICY IF EXISTS "Users can view own object_insurance" ON public.object_insurance;
      CREATE POLICY "Users can view own object_insurance" ON public.object_insurance
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_insurance.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can insert own object_insurance" ON public.object_insurance;
      CREATE POLICY "Users can insert own object_insurance" ON public.object_insurance
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_insurance.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can delete own object_insurance" ON public.object_insurance;
      CREATE POLICY "Users can delete own object_insurance" ON public.object_insurance
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_insurance.object_id AND objects.user_id = auth.uid())
        );

      -- Valuations policies
      DROP POLICY IF EXISTS "Users can view own valuations" ON public.valuations;
      CREATE POLICY "Users can view own valuations" ON public.valuations
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own valuations" ON public.valuations;
      CREATE POLICY "Users can insert own valuations" ON public.valuations
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own valuations" ON public.valuations;
      CREATE POLICY "Users can update own valuations" ON public.valuations
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own valuations" ON public.valuations;
      CREATE POLICY "Users can delete own valuations" ON public.valuations
        FOR DELETE USING (auth.uid() = user_id);

      -- Object valuations policies
      DROP POLICY IF EXISTS "Users can view own object_valuations" ON public.object_valuations;
      CREATE POLICY "Users can view own object_valuations" ON public.object_valuations
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_valuations.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can insert own object_valuations" ON public.object_valuations;
      CREATE POLICY "Users can insert own object_valuations" ON public.object_valuations
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_valuations.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can update own object_valuations" ON public.object_valuations;
      CREATE POLICY "Users can update own object_valuations" ON public.object_valuations
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_valuations.object_id AND objects.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can delete own object_valuations" ON public.object_valuations;
      CREATE POLICY "Users can delete own object_valuations" ON public.object_valuations
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.objects WHERE objects.id = object_valuations.object_id AND objects.user_id = auth.uid())
        );

      -- Expenses policies
      DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
      CREATE POLICY "Users can view own expenses" ON public.expenses
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
      CREATE POLICY "Users can insert own expenses" ON public.expenses
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
      CREATE POLICY "Users can update own expenses" ON public.expenses
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
      CREATE POLICY "Users can delete own expenses" ON public.expenses
        FOR DELETE USING (auth.uid() = user_id);
    `;

    await client.query(sql);
    console.log('MVP Migration completed successfully!');

    // Verify new tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nAll public tables after migration:');
    tables.rows.forEach(r => console.log('  -', r.table_name));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
