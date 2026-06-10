-- New registrar tables: provenance, exhibitions, publications, condition,
-- conservation, disposals, consignments, shipments, components, expenses,
-- reminders, activity log, custom field definitions.

create table public.provenance_events (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    sort_order integer not null default 0,
    owner_name text not null,
    owner_contact_id uuid references public.contacts(id),
    place text,
    transfer_method text check (transfer_method in (
        'Purchase', 'Gift', 'Descent', 'Auction', 'Commission', 'Unknown', 'Other')),
    date_text text,
    year_from integer,
    year_to integer,
    citation text,
    confidence text not null default 'documented' check (confidence in (
        'documented', 'probable', 'uncertain')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.exhibitions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    title text not null,
    venue_name text,
    venue_contact_id uuid references public.contacts(id),
    start_date date,
    end_date date,
    type text check (type in ('solo', 'group', 'fair', 'museum')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_exhibitions (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    exhibition_id uuid not null references public.exhibitions(id) on delete cascade,
    catalogue_number text,
    notes text,
    created_at timestamptz not null default now(),
    primary key (object_id, exhibition_id)
);

create table public.publications (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    title text not null,
    author text,
    publisher text,
    year integer,
    type text check (type in ('book', 'catalogue', 'article', 'online')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_publications (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    publication_id uuid not null references public.publications(id) on delete cascade,
    reference text,
    created_at timestamptz not null default now(),
    primary key (object_id, publication_id)
);

create table public.condition_reports (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    report_date date not null,
    examiner_contact_id uuid references public.contacts(id),
    overall_rating text check (overall_rating in ('Excellent', 'Good', 'Fair', 'Poor')),
    context text check (context in ('acquisition', 'loan_out', 'loan_in', 'periodic', 'damage')),
    summary text,
    findings jsonb not null default '{}'::jsonb, -- structured per-area observations; AI writes here later
    loan_id uuid references public.loans(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.conservation_treatments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    start_date date,
    end_date date,
    conservator_contact_id uuid references public.contacts(id),
    treatment_type text,
    description text,
    cost numeric,
    currency text not null default 'USD',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.disposals (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    disposal_type text not null check (disposal_type in (
        'Sale', 'Trade', 'Gift', 'Donation', 'Loss', 'Destruction')),
    disposal_date date,
    recipient_contact_id uuid references public.contacts(id),
    currency text not null default 'USD',
    total_proceeds numeric,
    commission numeric,
    invoice_number text,
    invoice_date date,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_disposals (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    disposal_id uuid not null references public.disposals(id) on delete cascade,
    sale_price numeric,
    commission numeric,
    created_at timestamptz not null default now(),
    primary key (object_id, disposal_id)
);

create table public.consignments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    direction text not null check (direction in ('in', 'out')),
    consignor_contact_id uuid references public.contacts(id),
    consignee_contact_id uuid references public.contacts(id),
    start_date date,
    end_date date,
    commission_pct numeric,
    terms text,
    status text not null default 'active' check (status in (
        'active', 'returned', 'sold', 'expired')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_consignments (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    consignment_id uuid not null references public.consignments(id) on delete cascade,
    asking_price numeric,
    status text,
    created_at timestamptz not null default now(),
    primary key (object_id, consignment_id)
);

create table public.shipments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    from_text text,
    to_text text,
    from_location_id uuid references public.locations(id),
    to_location_id uuid references public.locations(id),
    carrier_contact_id uuid references public.contacts(id),
    ship_date date,
    arrival_date date,
    waybill_number text,
    cost numeric,
    currency text not null default 'USD',
    status text,
    loan_id uuid references public.loans(id),
    consignment_id uuid references public.consignments(id),
    disposal_id uuid references public.disposals(id),
    packing jsonb not null default '{}'::jsonb, -- crate/packing details
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.object_shipments (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    shipment_id uuid not null references public.shipments(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (object_id, shipment_id)
);

create table public.object_components (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid not null references public.objects(id) on delete cascade,
    name text not null,
    description text,
    dimensions_text text,
    condition_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- expenses lives here so it can link to conservation + shipments
create table public.expenses (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    object_id uuid references public.objects(id) on delete cascade,
    expense_type text,
    expense_date date,
    vendor_contact_id uuid references public.contacts(id),
    amount numeric,
    currency text not null default 'USD',
    description text,
    invoice_number text,
    conservation_treatment_id uuid references public.conservation_treatments(id),
    shipment_id uuid references public.shipments(id),
    created_at timestamptz not null default now()
);

create table public.reminders (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    title text not null,
    due_date date not null,
    entity_type text,
    entity_id uuid,
    status text not null default 'open' check (status in ('open', 'done', 'dismissed')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.activity_log (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    changes jsonb,
    created_at timestamptz not null default now()
);

create table public.custom_field_definitions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    entity_type text not null,
    key text not null,
    label text not null,
    field_type text not null check (field_type in (
        'text', 'number', 'date', 'boolean', 'select')),
    options jsonb,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    unique (workspace_id, entity_type, key)
);
