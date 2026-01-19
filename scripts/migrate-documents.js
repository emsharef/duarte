require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Documents Migration: Documents table and entity_documents junction

    const sql = `
      -- ============================================
      -- DOCUMENTS TABLE
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users NOT NULL,

        -- Document Info
        document_type text,          -- Invoice, Certificate, Appraisal, Correspondence, Photo, Contract, Report, Other
        document_name text NOT NULL,
        description text,

        -- File Storage
        r2_key text NOT NULL,
        file_size integer,
        mime_type text,
        original_filename text,

        -- Date of document (not upload date)
        document_date date,

        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- ============================================
      -- ENTITY DOCUMENTS JUNCTION TABLE
      -- Links documents to any entity type
      -- ============================================

      CREATE TABLE IF NOT EXISTS public.entity_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
        entity_type text NOT NULL,   -- object, acquisition, loan, insurance, valuation, contact, artist, etc.
        entity_id uuid NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      );

      -- Unique constraint to prevent duplicate links
      CREATE UNIQUE INDEX IF NOT EXISTS entity_documents_unique_idx
        ON public.entity_documents (document_id, entity_type, entity_id);

      -- ============================================
      -- INDEXES
      -- ============================================

      CREATE INDEX IF NOT EXISTS documents_user_idx ON public.documents (user_id);
      CREATE INDEX IF NOT EXISTS documents_type_idx ON public.documents (document_type);
      CREATE INDEX IF NOT EXISTS documents_date_idx ON public.documents (document_date);
      CREATE INDEX IF NOT EXISTS documents_r2_key_idx ON public.documents (r2_key);
      CREATE INDEX IF NOT EXISTS entity_documents_document_idx ON public.entity_documents (document_id);
      CREATE INDEX IF NOT EXISTS entity_documents_entity_idx ON public.entity_documents (entity_type, entity_id);

      -- ============================================
      -- ROW LEVEL SECURITY POLICIES
      -- ============================================

      -- Enable RLS on new tables
      ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.entity_documents ENABLE ROW LEVEL SECURITY;

      -- Documents policies
      DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
      CREATE POLICY "Users can view own documents" ON public.documents
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
      CREATE POLICY "Users can insert own documents" ON public.documents
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
      CREATE POLICY "Users can update own documents" ON public.documents
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
      CREATE POLICY "Users can delete own documents" ON public.documents
        FOR DELETE USING (auth.uid() = user_id);

      -- Entity documents policies (via join to documents)
      DROP POLICY IF EXISTS "Users can view own entity_documents" ON public.entity_documents;
      CREATE POLICY "Users can view own entity_documents" ON public.entity_documents
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.documents WHERE documents.id = entity_documents.document_id AND documents.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can insert own entity_documents" ON public.entity_documents;
      CREATE POLICY "Users can insert own entity_documents" ON public.entity_documents
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.documents WHERE documents.id = entity_documents.document_id AND documents.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can update own entity_documents" ON public.entity_documents;
      CREATE POLICY "Users can update own entity_documents" ON public.entity_documents
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM public.documents WHERE documents.id = entity_documents.document_id AND documents.user_id = auth.uid())
        );

      DROP POLICY IF EXISTS "Users can delete own entity_documents" ON public.entity_documents;
      CREATE POLICY "Users can delete own entity_documents" ON public.entity_documents
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.documents WHERE documents.id = entity_documents.document_id AND documents.user_id = auth.uid())
        );
    `;

    await client.query(sql);
    console.log('Documents migration completed successfully!');

    // Verify new tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('documents', 'entity_documents')
      ORDER BY table_name
    `);
    console.log('\nDocument tables created:');
    tables.rows.forEach(r => console.log('  -', r.table_name));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
