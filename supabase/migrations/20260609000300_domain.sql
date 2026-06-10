-- Carried-over domain tables, workspace-scoped.

create table public.artists (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    first_name text,
    last_name text,
    company text,
    aka text,
    bio text,
    birth_year integer,
    death_year integer,
    nationality text,
    website text,
    r2_headshot_key text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.locations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name text not null,
    type text,
    description text,
    parent_id uuid references public.locations(id),
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    postal_code text,
    country text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name text not null,
    parent_id uuid references public.categories(id),
    created_at timestamptz not null default now()
);

create table public.groups (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now()
);

create table public.contacts (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    contact_type text,
    first_name text,
    last_name text,
    company_name text,
    display_name text,
    email text,
    phone text,
    mobile text,
    website text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    postal_code text,
    country text,
    notes text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.objects (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    title text not null,
    artist_id uuid references public.artists(id),
    category_id uuid references public.categories(id),
    location_id uuid references public.locations(id),
    permanent_location_id uuid references public.locations(id),
    location_status text not null default 'Unverified',
    status text not null default 'in_collection' check (status in (
        'in_collection', 'on_loan', 'on_consignment', 'sold', 'traded',
        'gifted', 'donated', 'lost', 'destroyed', 'deaccessioned')),
    inventory_number text,
    object_type text,
    medium text,
    year_created integer,
    description text,
    edition text,
    edition_number text,
    edition_size integer,
    edition_type text check (edition_type in ('numbered', 'AP', 'HC', 'TP')),
    signature_info text,
    inscription text,
    provenance text,
    condition_summary text,
    condition_description text,
    frame_condition text,
    is_framed boolean not null default false,
    is_insured boolean not null default false,
    currency text not null default 'USD',
    custom_fields jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_dimensions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    type text not null default 'dimensions',
    height numeric,
    width numeric,
    depth numeric,
    unit text not null default 'cm',
    created_at timestamptz not null default now()
);

create table public.object_media (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    type text not null,
    r2_key_original text not null,
    r2_key_medium text,
    r2_key_thumbnail text,
    name text,
    description text,
    is_primary boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.object_groups (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    group_id uuid not null references public.groups(id) on delete cascade,
    primary key (object_id, group_id)
);

create table public.acquisitions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    acquisition_subject text,
    acquisition_date date,
    acquisition_type text,
    acquired_from_contact_id uuid references public.contacts(id),
    bought_by_contact_id uuid references public.contacts(id),
    acquisition_price numeric,
    acquisition_discount numeric,
    buyer_premium numeric,
    taxes numeric,
    total_cost numeric,
    currency text not null default 'USD',
    base_currency text default 'USD',
    exchange_rate numeric,
    invoice_number text,
    invoice_date date,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_acquisitions (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    acquisition_id uuid not null references public.acquisitions(id) on delete cascade,
    object_price numeric,
    discount numeric default 0,
    buyer_premium numeric default 0,
    taxes numeric default 0,
    lot_number text,
    created_at timestamptz not null default now(),
    primary key (object_id, acquisition_id)
);

create table public.insurance_policies (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    policy_subject text,
    policy_number text,
    insurer_contact_id uuid references public.contacts(id),
    start_date date,
    end_date date,
    coverage_type text,
    total_coverage numeric,
    deductible numeric,
    premium numeric,
    currency text not null default 'USD',
    is_active boolean not null default true,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_insurance (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    policy_id uuid not null references public.insurance_policies(id) on delete cascade,
    insured_value numeric,
    primary key (object_id, policy_id)
);

create table public.valuations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    valuation_subject text,
    valuation_date date,
    valuation_status text not null default 'Pending',
    appraiser_contact_id uuid references public.contacts(id),
    value_type text,
    total_value numeric,
    currency text not null default 'USD',
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_valuations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid references public.objects(id) on delete cascade,
    valuation_id uuid references public.valuations(id) on delete cascade,
    appraised_value numeric,
    low_estimate numeric,
    high_estimate numeric,
    notes text,
    created_at timestamptz not null default now()
);

create table public.loans (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    loan_subject text,
    direction text,
    status text not null default 'Pending',
    borrower_contact_id uuid references public.contacts(id),
    lender_contact_id uuid references public.contacts(id),
    exhibition_name text,
    venue text,
    start_date date,
    end_date date,
    actual_return_date date,
    insurance_value numeric,
    insurance_policy_id uuid references public.insurance_policies(id),
    currency text not null default 'USD',
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_loans (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    loan_id uuid not null references public.loans(id) on delete cascade,
    loan_value numeric,
    condition_out text,
    condition_in text,
    primary key (object_id, loan_id)
);

create table public.documents (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    document_type text,
    document_name text not null,
    description text,
    r2_key text not null,
    file_size integer,
    mime_type text,
    original_filename text,
    document_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.entity_documents (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    document_id uuid references public.documents(id) on delete cascade,
    entity_type text not null,
    entity_id uuid not null,
    created_at timestamptz not null default now()
);
