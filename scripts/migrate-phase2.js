const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
      -- Artists
      create table if not exists public.artists (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users not null,
        name text not null,
        bio text,
        created_at timestamp with time zone default now()
      );

      -- Locations (Hierarchical)
      create table if not exists public.locations (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users not null,
        name text not null,
        parent_id uuid references public.locations(id),
        type text, -- e.g., 'Building', 'Room', 'Shelf'
        created_at timestamp with time zone default now()
      );

      -- Categories (Hierarchical)
      create table if not exists public.categories (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users not null,
        name text not null,
        parent_id uuid references public.categories(id),
        created_at timestamp with time zone default now()
      );

      -- Groups
      create table if not exists public.groups (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users not null,
        name text not null,
        description text,
        created_at timestamp with time zone default now()
      );

      -- Objects (The Core Table)
      create table if not exists public.objects (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users not null,
        title text not null,
        artist_id uuid references public.artists(id),
        category_id uuid references public.categories(id),
        location_id uuid references public.locations(id),
        status text default 'Available',
        year_created integer,
        description text,
        custom_fields jsonb default '{}'::jsonb,
        created_at timestamp with time zone default now()
      );

      -- Object Dimensions
      create table if not exists public.object_dimensions (
        id uuid primary key default gen_random_uuid(),
        object_id uuid references public.objects(id) on delete cascade not null,
        type text default 'dimensions', -- e.g., 'framed', 'unframed', 'base'
        height numeric,
        width numeric,
        depth numeric,
        unit text default 'cm',
        created_at timestamp with time zone default now()
      );

      -- Object Media (Images/Docs)
      create table if not exists public.object_media (
        id uuid primary key default gen_random_uuid(),
        object_id uuid references public.objects(id) on delete cascade not null,
        type text not null, -- 'image', 'document'
        r2_key_original text not null,
        r2_key_medium text,
        r2_key_thumbnail text,
        name text,
        description text,
        is_primary boolean default false,
        created_at timestamp with time zone default now()
      );

      -- Object Groups (Join Table)
      create table if not exists public.object_groups (
        object_id uuid references public.objects(id) on delete cascade not null,
        group_id uuid references public.groups(id) on delete cascade not null,
        primary key (object_id, group_id)
      );

      -- Indexes
      create index if not exists objects_artist_idx on public.objects (artist_id);
      create index if not exists objects_location_idx on public.objects (location_id);
      create index if not exists objects_category_idx on public.objects (category_id);
      create index if not exists object_media_object_idx on public.object_media (object_id);
    `;

        await client.query(sql);
        console.log('Phase 2 Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
