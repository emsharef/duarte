# Phase 1: Foundation & Schema Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild duarte's database as a workspace-multi-tenant, RLS-enforced schema with the full registrar data model, and adapt the existing app from `user_id` to workspace scoping — app works exactly as today, but tenant-safe and on the complete new schema.

**Architecture:** Five SQL migrations (checked into `supabase/migrations/`) drop the old empty tables and create tenancy + domain + registrar tables with RLS-by-membership via two helper functions. App-side, one `getWorkspaceContext()` helper replaces all `auth.getUser()` scoping; a cookie holds the active workspace; a switcher and a settings/members page complete the UX. Verification is a SQL RLS test (two simulated users) plus `npm run build` and manual CRUD smoke tests.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres 17, RLS, security-definer RPCs), Cloudflare R2, TypeScript. Migrations applied with the Supabase MCP `apply_migration` tool (project ref `acrvteypohtcmywoiudv`); fallback `npx supabase db push`.

**Spec:** `docs/superpowers/specs/2026-06-09-phase1-foundation-schema-design.md`

**Conventions used throughout:**
- The Supabase project id is `acrvteypohtcmywoiudv` (name "DuArte"). It is ACTIVE and **empty (0 rows in every table)** — dropping tables loses nothing.
- All code in this repo uses 4-space indentation, single quotes, no semicolons in TS.
- "Run advisors" means MCP tool `get_advisors` with type `security` then `performance`.

---

### Task 1: Commit the in-flight picker work

The working tree has a finished UX refactor (contact/location pickers). Commit it as-is before any schema work.

**Files:**
- Modify: none (commit existing changes)

- [ ] **Step 1: Verify the tree builds and lints**

Run: `npm run build && npm run lint`
Expected: build succeeds; lint passes (warnings acceptable, errors not). If build fails, STOP and report — do not fix unrelated breakage silently.

- [ ] **Step 2: Commit everything currently modified/untracked**

```bash
git add -A
git commit -m "Add contact and location pickers with inline create across forms

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Scaffold supabase dir + legacy-drop migration

**Files:**
- Create: `supabase/migrations/20260609000100_drop_legacy.sql`
- Create: `supabase/config.toml` (via CLI init, or by hand if CLI unavailable)

- [ ] **Step 1: Initialize supabase project dir**

Run: `npx supabase init --force 2>/dev/null || mkdir -p supabase/migrations`
Expected: `supabase/` directory with `migrations/` exists. (If `npx supabase init` prompts or fails, plain `mkdir -p supabase/migrations` is fine — config.toml is only needed for local stack, which we don't use in Phase 1.)

- [ ] **Step 2: Write the drop-legacy migration**

Create `supabase/migrations/20260609000100_drop_legacy.sql`:

```sql
-- Phase 1 baseline: the remote DB is empty (0 rows everywhere); drop all legacy tables.
drop table if exists
    public.entity_documents,
    public.documents,
    public.object_loans,
    public.loans,
    public.expenses,
    public.object_valuations,
    public.valuations,
    public.object_insurance,
    public.insurance_policies,
    public.object_acquisitions,
    public.acquisitions,
    public.contacts,
    public.object_groups,
    public.groups,
    public.object_media,
    public.object_dimensions,
    public.objects,
    public.categories,
    public.locations,
    public.artists
    cascade;
```

- [ ] **Step 3: Commit**

```bash
git add supabase
git commit -m "Add supabase migrations scaffold and legacy-drop migration

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Tenancy migration (workspaces, members, invites, helpers, RPCs)

**Files:**
- Create: `supabase/migrations/20260609000200_tenancy.sql`

- [ ] **Step 1: Write the tenancy migration**

Create `supabase/migrations/20260609000200_tenancy.sql`:

```sql
-- Tenancy: workspaces, membership, invites, RLS helpers, bootstrap RPCs.

create table public.workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    accession_prefix text, -- null = auto-numbering disabled
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.workspace_members (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'editor', 'viewer')),
    created_at timestamptz not null default now(),
    primary key (workspace_id, user_id)
);

create table public.workspace_invites (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    email text not null,
    role text not null check (role in ('owner', 'editor', 'viewer')),
    token uuid not null unique default gen_random_uuid(),
    invited_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    accepted_at timestamptz
);

create index workspace_members_user_idx on public.workspace_members (user_id);
create index workspace_invites_workspace_idx on public.workspace_invites (workspace_id);

-- RLS helpers. SECURITY DEFINER so they can read workspace_members regardless of caller.
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from workspace_members
        where workspace_id = ws_id and user_id = auth.uid()
    )
$$;

create or replace function public.can_edit_workspace(ws_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from workspace_members
        where workspace_id = ws_id and user_id = auth.uid() and role in ('owner', 'editor')
    )
$$;

create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from workspace_members
        where workspace_id = ws_id and user_id = auth.uid() and role = 'owner'
    )
$$;

-- Bootstrap: every user gets a personal workspace on first use (lazy, idempotent).
create or replace function public.ensure_personal_workspace()
returns uuid language plpgsql security definer set search_path = public as $$
declare
    ws uuid;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;
    select workspace_id into ws from workspace_members where user_id = auth.uid() limit 1;
    if ws is not null then
        return ws;
    end if;
    insert into workspaces (name, created_by)
    values (coalesce(nullif(split_part(auth.email(), '@', 1), ''), 'My') || '''s Collection', auth.uid())
    returning id into ws;
    insert into workspace_members (workspace_id, user_id, role) values (ws, auth.uid(), 'owner');
    return ws;
end
$$;

-- Invite acceptance: matches the logged-in user's email, activates membership.
create or replace function public.accept_workspace_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
    inv record;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;
    select * into inv from workspace_invites
    where token = invite_token and accepted_at is null
      and lower(email) = lower(coalesce(auth.email(), ''));
    if inv is null then
        raise exception 'invite not found, already used, or email does not match';
    end if;
    insert into workspace_members (workspace_id, user_id, role)
    values (inv.workspace_id, auth.uid(), inv.role)
    on conflict (workspace_id, user_id) do nothing;
    update workspace_invites set accepted_at = now() where id = inv.id;
    return inv.workspace_id;
end
$$;

-- RLS for tenancy tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

create policy workspaces_select on public.workspaces for select
    using ((select public.is_workspace_member(id)) or created_by = (select auth.uid()));
create policy workspaces_insert on public.workspaces for insert
    with check (created_by = (select auth.uid()));
create policy workspaces_update on public.workspaces for update
    using ((select public.is_workspace_owner(id)));
create policy workspaces_delete on public.workspaces for delete
    using ((select public.is_workspace_owner(id)));

create policy members_select on public.workspace_members for select
    using ((select public.is_workspace_member(workspace_id)));
create policy members_insert on public.workspace_members for insert
    with check ((select public.is_workspace_owner(workspace_id)));
create policy members_update on public.workspace_members for update
    using ((select public.is_workspace_owner(workspace_id)));
create policy members_delete on public.workspace_members for delete
    using ((select public.is_workspace_owner(workspace_id)) or user_id = (select auth.uid()));

create policy invites_select on public.workspace_invites for select
    using ((select public.is_workspace_member(workspace_id)));
create policy invites_insert on public.workspace_invites for insert
    with check ((select public.is_workspace_owner(workspace_id)));
create policy invites_update on public.workspace_invites for update
    using ((select public.is_workspace_owner(workspace_id)));
create policy invites_delete on public.workspace_invites for delete
    using ((select public.is_workspace_owner(workspace_id)));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260609000200_tenancy.sql
git commit -m "Add tenancy migration: workspaces, members, invites, RLS helpers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Domain migration (carried-over tables, workspace-scoped)

Recreates every pre-existing table with `workspace_id` instead of `user_id`. Column sets match the old schema (captured from the live DB on 2026-06-09) except: `objects` status cleanup + edition fields (per spec §3), `locations` gains description/address fields (the app's `Location` type already expects them), `expenses` gains conservation/shipment links, and `artists`/junction tables gain `updated_at`/`workspace_id` as noted.

**Files:**
- Create: `supabase/migrations/20260609000300_domain.sql`

- [ ] **Step 1: Write the domain migration**

Create `supabase/migrations/20260609000300_domain.sql`:

```sql
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
```

Note: `expenses` is created in the registrar migration (Task 5) because it references `conservation_treatments` and `shipments`.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260609000300_domain.sql
git commit -m "Add domain migration: carried-over tables workspace-scoped

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Registrar migration (new tables per spec §2)

**Files:**
- Create: `supabase/migrations/20260609000400_registrar.sql`

- [ ] **Step 1: Write the registrar migration**

Create `supabase/migrations/20260609000400_registrar.sql`:

```sql
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

-- expenses lives here so it can link to conservation + shipments (spec §2 carried-over notes)
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260609000400_registrar.sql
git commit -m "Add registrar migration: provenance, exhibitions, condition, disposals, consignments, shipments

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: RLS, triggers, and indexes migration

**Files:**
- Create: `supabase/migrations/20260609000500_rls_triggers_indexes.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260609000500_rls_triggers_indexes.sql`:

```sql
-- RLS for all domain tables, updated_at + activity-log triggers, indexes.

-- 1) Standard RLS policy set on every domain table (all have workspace_id).
do $$
declare
    t text;
begin
    foreach t in array array[
        'artists', 'locations', 'categories', 'groups', 'contacts', 'objects',
        'object_dimensions', 'object_media', 'object_groups',
        'acquisitions', 'object_acquisitions',
        'insurance_policies', 'object_insurance',
        'valuations', 'object_valuations',
        'loans', 'object_loans',
        'documents', 'entity_documents',
        'provenance_events', 'exhibitions', 'object_exhibitions',
        'publications', 'object_publications',
        'condition_reports', 'conservation_treatments',
        'disposals', 'object_disposals',
        'consignments', 'object_consignments',
        'shipments', 'object_shipments',
        'object_components', 'expenses', 'reminders',
        'activity_log', 'custom_field_definitions'
    ] loop
        execute format('alter table public.%I enable row level security', t);
        execute format(
            'create policy %I on public.%I for select using ((select public.is_workspace_member(workspace_id)))',
            t || '_select', t);
        execute format(
            'create policy %I on public.%I for insert with check ((select public.can_edit_workspace(workspace_id)))',
            t || '_insert', t);
        execute format(
            'create policy %I on public.%I for update using ((select public.can_edit_workspace(workspace_id)))',
            t || '_update', t);
        execute format(
            'create policy %I on public.%I for delete using ((select public.can_edit_workspace(workspace_id)))',
            t || '_delete', t);
        execute format('create index %I on public.%I (workspace_id)', t || '_workspace_idx', t);
    end loop;
end
$$;

-- activity_log is append-only for users: drop its update/delete policies.
drop policy activity_log_update on public.activity_log;
drop policy activity_log_delete on public.activity_log;

-- 2) updated_at trigger on tables that have the column.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end
$$;

do $$
declare
    t text;
begin
    foreach t in array array[
        'workspaces', 'artists', 'locations', 'contacts', 'objects',
        'acquisitions', 'insurance_policies', 'valuations', 'loans', 'documents',
        'provenance_events', 'exhibitions', 'publications',
        'condition_reports', 'conservation_treatments', 'disposals',
        'consignments', 'shipments', 'object_components', 'reminders'
    ] loop
        execute format(
            'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    end loop;
end
$$;

-- 3) Activity log trigger on main entity tables (those with a uuid id pk).
create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into activity_log (workspace_id, user_id, action, entity_type, entity_id, changes)
    values (
        coalesce(new.workspace_id, old.workspace_id),
        auth.uid(),
        lower(tg_op),
        tg_table_name,
        coalesce(new.id, old.id),
        case tg_op
            when 'INSERT' then to_jsonb(new)
            when 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
            else to_jsonb(old)
        end
    );
    return coalesce(new, old);
end
$$;

do $$
declare
    t text;
begin
    foreach t in array array[
        'artists', 'locations', 'categories', 'groups', 'contacts', 'objects',
        'acquisitions', 'insurance_policies', 'valuations', 'loans', 'documents',
        'provenance_events', 'exhibitions', 'publications',
        'condition_reports', 'conservation_treatments', 'disposals',
        'consignments', 'shipments', 'object_components', 'expenses', 'reminders'
    ] loop
        execute format(
            'create trigger log_activity after insert or update or delete on public.%I for each row execute function public.log_activity()', t);
    end loop;
end
$$;

-- 4) FK indexes beyond workspace_id (junction PKs already cover their first column).
create index objects_artist_idx on public.objects (artist_id);
create index objects_category_idx on public.objects (category_id);
create index objects_location_idx on public.objects (location_id);
create index objects_permanent_location_idx on public.objects (permanent_location_id);
create index locations_parent_idx on public.locations (parent_id);
create index categories_parent_idx on public.categories (parent_id);
create index object_dimensions_object_idx on public.object_dimensions (object_id);
create index object_media_object_idx on public.object_media (object_id);
create index object_acquisitions_acq_idx on public.object_acquisitions (acquisition_id);
create index object_insurance_policy_idx on public.object_insurance (policy_id);
create index object_valuations_object_idx on public.object_valuations (object_id);
create index object_valuations_valuation_idx on public.object_valuations (valuation_id);
create index object_loans_loan_idx on public.object_loans (loan_id);
create index object_groups_group_idx on public.object_groups (group_id);
create index entity_documents_document_idx on public.entity_documents (document_id);
create index entity_documents_entity_idx on public.entity_documents (entity_type, entity_id);
create index expenses_object_idx on public.expenses (object_id);
create index provenance_events_object_idx on public.provenance_events (object_id);
create index object_exhibitions_exh_idx on public.object_exhibitions (exhibition_id);
create index object_publications_pub_idx on public.object_publications (publication_id);
create index condition_reports_object_idx on public.condition_reports (object_id);
create index conservation_treatments_object_idx on public.conservation_treatments (object_id);
create index object_disposals_disposal_idx on public.object_disposals (disposal_id);
create index object_consignments_consignment_idx on public.object_consignments (consignment_id);
create index object_shipments_shipment_idx on public.object_shipments (shipment_id);
create index object_components_object_idx on public.object_components (object_id);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);
create index reminders_due_idx on public.reminders (workspace_id, due_date);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260609000500_rls_triggers_indexes.sql
git commit -m "Add RLS policies, triggers, and indexes migration

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Apply migrations and run advisors

**Files:** none (remote DB operations)

- [ ] **Step 1: Apply the five migrations in order**

Use the Supabase MCP tool `apply_migration` (project_id `acrvteypohtcmywoiudv`) five times, with `name` set to the migration filename stem (e.g. `drop_legacy`) and `query` set to the exact file contents, in this order:

1. `20260609000100_drop_legacy.sql`
2. `20260609000200_tenancy.sql`
3. `20260609000300_domain.sql`
4. `20260609000400_registrar.sql`
5. `20260609000500_rls_triggers_indexes.sql`

Expected: each returns success. If a migration fails partway, fix the SQL file, then drop and re-apply from `drop_legacy` (plus `drop table if exists workspaces, workspace_members, workspace_invites cascade;` and `drop function if exists` for the helpers) — the DB has no data worth preserving.

(Fallback without MCP: `npx supabase link --project-ref acrvteypohtcmywoiudv && npx supabase db push`.)

- [ ] **Step 2: Verify table inventory**

Use MCP `list_tables` (schemas: `["public"]`). Expected: the 40 tables from the migrations, no legacy leftovers, `rls_enabled: true` on every one.

- [ ] **Step 3: Run advisors**

Use MCP `get_advisors` with type `security`, then `performance`. Expected: no RLS-disabled findings. Function search-path or other WARN-level notices: record them in the final report; fix only if ERROR-level.

---

### Task 8: RLS test script

**Files:**
- Create: `supabase/tests/rls_test.sql`

- [ ] **Step 1: Write the test**

Create `supabase/tests/rls_test.sql`. It creates two users + two workspaces inside a transaction, asserts isolation under simulated JWTs, and rolls back (no residue):

```sql
-- RLS isolation test. Run the whole file as one statement batch; it rolls back at the end.
begin;

-- Two fake auth users (rolled back).
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
     'authenticated', 'authenticated', 'rls-a@test.local', '', now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
     'authenticated', 'authenticated', 'rls-b@test.local', '', now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.workspaces (id, name, created_by) values
    ('aaaaaaaa-0000-0000-0000-000000000001', 'WS A', '11111111-1111-1111-1111-111111111111'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'WS B', '22222222-2222-2222-2222-222222222222');

insert into public.workspace_members (workspace_id, user_id, role) values
    ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
    ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'owner');

insert into public.objects (id, workspace_id, title) values
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'Object in A'),
    ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000002', 'Object in B');

insert into public.contacts (workspace_id, display_name) values
    ('aaaaaaaa-0000-0000-0000-000000000001', 'Contact in A'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'Contact in B');

-- Become user A (authenticated role + JWT claims).
set local role authenticated;
select set_config('request.jwt.claims',
    '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","email":"rls-a@test.local"}', true);

do $$
begin
    -- A sees only A's rows
    if (select count(*) from public.objects) <> 1 then
        raise exception 'FAIL: user A sees % objects, expected 1', (select count(*) from public.objects);
    end if;
    if (select title from public.objects) <> 'Object in A' then
        raise exception 'FAIL: user A sees wrong object';
    end if;
    if (select count(*) from public.contacts) <> 1 then
        raise exception 'FAIL: user A sees % contacts, expected 1', (select count(*) from public.contacts);
    end if;
    if (select count(*) from public.workspaces) <> 1 then
        raise exception 'FAIL: user A sees % workspaces, expected 1', (select count(*) from public.workspaces);
    end if;
    -- A cannot update B's object (0 rows affected)
    update public.objects set title = 'hacked'
        where id = 'bbbbbbbb-0000-0000-0000-00000000000b';
    if found then
        raise exception 'FAIL: user A updated an object in workspace B';
    end if;
    -- A cannot insert into B's workspace
    begin
        insert into public.objects (workspace_id, title)
        values ('bbbbbbbb-0000-0000-0000-000000000002', 'smuggled');
        raise exception 'FAIL: user A inserted into workspace B';
    exception when insufficient_privilege or check_violation then
        null; -- expected: RLS rejects
    end;
    raise notice 'RLS TEST PASSED for user A';
end
$$;

-- Become user B and check the mirror image.
select set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","email":"rls-b@test.local"}', true);

do $$
begin
    if (select count(*) from public.objects) <> 1 then
        raise exception 'FAIL: user B sees % objects, expected 1', (select count(*) from public.objects);
    end if;
    if (select title from public.objects) <> 'Object in B' then
        raise exception 'FAIL: user B sees wrong object';
    end if;
    raise notice 'RLS TEST PASSED for user B';
end
$$;

rollback;
```

- [ ] **Step 2: Run it and verify it passes**

Run the entire file contents via MCP `execute_sql` (project_id `acrvteypohtcmywoiudv`).
Expected: completes without error (the `raise exception 'FAIL: ...'` lines are the assertions — any failure aborts with that message). If `insufficient_privilege or check_violation` doesn't catch the RLS rejection (Postgres raises `42501`), adjust the exception clause to `when others` with a message check — but try the specific codes first.

- [ ] **Step 3: Negative control (prove the test can fail)**

Temporarily change `expected 1` check for user A objects to `<> 2` and re-run: it must FAIL with the raise message. Revert. This validates the harness.

- [ ] **Step 4: Commit**

```bash
git add supabase/tests/rls_test.sql
git commit -m "Add SQL RLS isolation test (two users, two workspaces)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Generate TypeScript types and wire into clients

**Files:**
- Create: `lib/database.types.ts`
- Modify: `lib/supabase/server.ts`
- Modify: `lib/supabase/client.ts`

- [ ] **Step 1: Generate types**

Use MCP `generate_typescript_types` (project_id `acrvteypohtcmywoiudv`); write the returned source verbatim to `lib/database.types.ts`.
(Fallback: `npx supabase gen types typescript --project-id acrvteypohtcmywoiudv > lib/database.types.ts`.)

- [ ] **Step 2: Type the server client**

In `lib/supabase/server.ts`, change the import and the call:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        ...
```

(Only the generic parameter and import are added; the cookies block is unchanged.)

- [ ] **Step 3: Type the browser client**

In `lib/supabase/client.ts`, add the same `<Database>` generic to its `createBrowserClient` call and the `import type { Database } from '@/lib/database.types'` import. Read the file first; it is a few lines.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS. Typed clients may surface type errors in action files — those are fixed in Tasks 11–14; if build fails *only* with such errors, note it and proceed (the build gate returns in Task 16). If you want a green build at every commit, defer Steps 2–3 of this task until after Task 14 — acceptable variation.

- [ ] **Step 5: Commit**

```bash
git add lib/database.types.ts lib/supabase/server.ts lib/supabase/client.ts
git commit -m "Generate database types and type the Supabase clients

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Workspace context helper

**Files:**
- Create: `lib/workspace.ts`

- [ ] **Step 1: Write the helper**

Create `lib/workspace.ts`:

```ts
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const WORKSPACE_COOKIE = 'duarte-workspace'

export type WorkspaceRole = 'owner' | 'editor' | 'viewer'

export type WorkspaceContext = {
    supabase: Awaited<ReturnType<typeof createClient>>
    userId: string
    userEmail: string | undefined
    workspaceId: string
    role: WorkspaceRole
    memberships: { workspace_id: string; role: WorkspaceRole; name: string }[]
}

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: rows } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(name)')
        .eq('user_id', user.id)

    let memberships = (rows ?? []).map((r) => ({
        workspace_id: r.workspace_id,
        role: r.role as WorkspaceRole,
        name: (r.workspaces as unknown as { name: string } | null)?.name ?? 'Workspace',
    }))

    if (memberships.length === 0) {
        const { data: wsId, error } = await supabase.rpc('ensure_personal_workspace')
        if (error || !wsId) throw new Error(error?.message ?? 'Could not create workspace')
        memberships = [{ workspace_id: wsId, role: 'owner', name: 'My Collection' }]
    }

    const cookieStore = await cookies()
    const requested = cookieStore.get(WORKSPACE_COOKIE)?.value
    const active = memberships.find((m) => m.workspace_id === requested) ?? memberships[0]

    return {
        supabase,
        userId: user.id,
        userEmail: user.email,
        workspaceId: active.workspace_id,
        role: active.role,
        memberships,
    }
}

export function requireEdit(ctx: Pick<WorkspaceContext, 'role'>) {
    if (ctx.role === 'viewer') throw new Error('You have read-only access to this workspace')
}

export function requireOwner(ctx: Pick<WorkspaceContext, 'role'>) {
    if (ctx.role !== 'owner') throw new Error('Only the workspace owner can do this')
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep workspace.ts`
Expected: no errors mentioning `lib/workspace.ts`. (If the generated types make `rpc('ensure_personal_workspace')` typed, the cast-free version should work; adjust the membership mapping cast if the join shape differs — check the generated `Database` type for `workspace_members`.)

- [ ] **Step 3: Commit**

```bash
git add lib/workspace.ts
git commit -m "Add getWorkspaceContext helper with role guards

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Workspace switcher + layout wiring + switch/invite routes

**Files:**
- Create: `app/actions/workspace.ts`
- Create: `components/workspace-switcher.tsx`
- Create: `app/invite/[token]/page.tsx`
- Modify: `app/dashboard/layout.tsx`
- Modify: `components/sidebar.tsx`

- [ ] **Step 1: Server actions for switching/creating workspaces**

Create `app/actions/workspace.ts`:

```ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getWorkspaceContext, WORKSPACE_COOKIE } from '@/lib/workspace'

export async function setActiveWorkspace(workspaceId: string) {
    const ctx = await getWorkspaceContext()
    if (!ctx.memberships.some((m) => m.workspace_id === workspaceId)) {
        throw new Error('Not a member of that workspace')
    }
    const cookieStore = await cookies()
    cookieStore.set(WORKSPACE_COOKIE, workspaceId, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function createWorkspace(name: string) {
    const ctx = await getWorkspaceContext()
    const { data, error } = await ctx.supabase
        .from('workspaces')
        .insert({ name, created_by: ctx.userId })
        .select('id')
        .single()
    if (error) throw new Error(error.message)
    const { error: memberError } = await ctx.supabase
        .from('workspace_members')
        .insert({ workspace_id: data.id, user_id: ctx.userId, role: 'owner' })
    if (memberError) throw new Error(memberError.message)
    await setActiveWorkspace(data.id)
}
```

Note: `workspace_members` insert is allowed because the RLS `members_insert` policy requires `is_workspace_owner` — which is false for a brand-new workspace. **Check this during implementation**: if the insert fails, replace `createWorkspace` body with a security-definer RPC `create_workspace(name text)` added via a new migration `20260609000600_create_workspace_rpc.sql`:

```sql
create or replace function public.create_workspace(ws_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
    ws uuid;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    insert into workspaces (name, created_by) values (ws_name, auth.uid()) returning id into ws;
    insert into workspace_members (workspace_id, user_id, role) values (ws, auth.uid(), 'owner');
    return ws;
end
$$;
```

and call it with `ctx.supabase.rpc('create_workspace', { ws_name: name })`. Prefer the RPC if in doubt — it is the same pattern as `ensure_personal_workspace`.

- [ ] **Step 2: Switcher component**

Create `components/workspace-switcher.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { setActiveWorkspace } from '@/app/actions/workspace'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type Membership = { workspace_id: string; role: string; name: string }

export function WorkspaceSwitcher({
    memberships,
    activeWorkspaceId,
}: {
    memberships: Membership[]
    activeWorkspaceId: string
}) {
    const [isPending, startTransition] = useTransition()
    const active = memberships.find((m) => m.workspace_id === activeWorkspaceId)

    if (memberships.length <= 1) {
        return (
            <div className="px-3 py-2 text-sm font-medium text-gray-700 truncate">
                {active?.name ?? 'Workspace'}
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={isPending}>
                    <span className="truncate">{active?.name ?? 'Workspace'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {memberships.map((m) => (
                    <DropdownMenuItem
                        key={m.workspace_id}
                        onSelect={() => startTransition(() => setActiveWorkspace(m.workspace_id))}
                    >
                        <Check
                            className={cn(
                                'mr-2 h-4 w-4',
                                m.workspace_id === activeWorkspaceId ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                        <span className="truncate">{m.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{m.role}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

- [ ] **Step 3: Wire into layout and sidebar**

Replace `app/dashboard/layout.tsx` with:

```tsx
import { Sidebar } from '@/components/sidebar'
import { getWorkspaceContext } from '@/lib/workspace'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const ctx = await getWorkspaceContext()

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar memberships={ctx.memberships} activeWorkspaceId={ctx.workspaceId} />
            <main className="flex-1 overflow-y-auto border-l border-gray-200">
                <div className="h-full px-8 py-6">{children}</div>
            </main>
        </div>
    )
}
```

In `components/sidebar.tsx`: add props and render the switcher under the brand header. The signature becomes:

```tsx
import { WorkspaceSwitcher } from '@/components/workspace-switcher'

type Membership = { workspace_id: string; role: string; name: string }

export function Sidebar({
    memberships,
    activeWorkspaceId,
}: {
    memberships: Membership[]
    activeWorkspaceId: string
}) {
```

and directly after the `<div className="flex h-16 items-center border-b px-6">…</div>` block insert:

```tsx
            <div className="border-b px-3 py-3">
                <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />
            </div>
```

The rest of the file (Add Object button, nav) is unchanged. Note: `components/ui/dropdown-menu.tsx` already exists (@radix-ui/react-dropdown-menu is a dependency); if the file is missing, add it via `npx shadcn@latest add dropdown-menu`.

- [ ] **Step 4: Invite acceptance page**

Create `app/invite/[token]/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/login?next=/invite/${token}`)

    const { data: workspaceId, error } = await supabase.rpc('accept_workspace_invite', {
        invite_token: token,
    })

    if (error || !workspaceId) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-sm text-gray-600">
                    This invite is invalid, already used, or was sent to a different email address.
                </p>
            </div>
        )
    }

    redirect('/dashboard')
}
```

(`login?next=` redirect-after-login support: in `app/login/actions.ts`, read `formData.get('next')` and pass it to the final `redirect()` if it starts with `/`; add `<input type="hidden" name="next" />` populated from the search param in `app/login/page.tsx`. If the login page structure makes this awkward, an invite link opened while logged out can simply be re-visited after login — acceptable for Phase 1; note it in the final report.)

- [ ] **Step 5: Build and commit**

Run: `npm run build`
Expected: PASS (modulo any pre-existing action-file type errors noted in Task 9).

```bash
git add app/actions/workspace.ts components/workspace-switcher.tsx app/invite app/dashboard/layout.tsx components/sidebar.tsx
git commit -m "Add workspace switcher, layout wiring, and invite acceptance

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Settings page (members & invites)

**Files:**
- Create: `app/dashboard/settings/page.tsx`
- Create: `app/dashboard/settings/actions.ts`
- Create: `app/dashboard/settings/members.tsx`

The sidebar already links to `/dashboard/settings` (currently 404).

- [ ] **Step 1: Server actions**

Create `app/dashboard/settings/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspaceContext, requireOwner, type WorkspaceRole } from '@/lib/workspace'

export async function createInvite(email: string, role: WorkspaceRole) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    const { data, error } = await ctx.supabase
        .from('workspace_invites')
        .insert({ workspace_id: ctx.workspaceId, email, role, invited_by: ctx.userId })
        .select('token')
        .single()
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
    return { token: data.token as string }
}

export async function revokeInvite(inviteId: string) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    const { error } = await ctx.supabase
        .from('workspace_invites')
        .delete()
        .eq('id', inviteId)
        .eq('workspace_id', ctx.workspaceId)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function updateMemberRole(userId: string, role: WorkspaceRole) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    if (userId === ctx.userId) throw new Error('Owners cannot change their own role')
    const { error } = await ctx.supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', ctx.workspaceId)
        .eq('user_id', userId)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function removeMember(userId: string) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    if (userId === ctx.userId) throw new Error('Owners cannot remove themselves')
    const { error } = await ctx.supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', ctx.workspaceId)
        .eq('user_id', userId)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function renameWorkspace(name: string) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    const { error } = await ctx.supabase
        .from('workspaces')
        .update({ name })
        .eq('id', ctx.workspaceId)
    if (error) throw new Error(error.message)
    revalidatePath('/', 'layout')
}
```

- [ ] **Step 2: Page (server component)**

Create `app/dashboard/settings/page.tsx`:

```tsx
import { getWorkspaceContext } from '@/lib/workspace'
import { MembersPanel } from './members'

export default async function SettingsPage() {
    const ctx = await getWorkspaceContext()

    const [{ data: members }, { data: invites }] = await Promise.all([
        ctx.supabase
            .from('workspace_members')
            .select('user_id, role, created_at')
            .eq('workspace_id', ctx.workspaceId)
            .order('created_at'),
        ctx.supabase
            .from('workspace_invites')
            .select('id, email, role, token, accepted_at, created_at')
            .eq('workspace_id', ctx.workspaceId)
            .is('accepted_at', null)
            .order('created_at'),
    ])

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-gray-500">Manage this workspace and its members.</p>
            </div>
            <MembersPanel
                members={members ?? []}
                invites={invites ?? []}
                currentUserId={ctx.userId}
                isOwner={ctx.role === 'owner'}
            />
        </div>
    )
}
```

Note on member emails: `workspace_members` has no email column and `auth.users` is not readable from the client. Display `user_id` truncated for now with the current user labeled "you" — OR add a `member_emails` security-definer SQL function in the optional `20260609000600` migration returning `(user_id uuid, email text)` for a workspace the caller belongs to:

```sql
create or replace function public.workspace_member_emails(ws_id uuid)
returns table (user_id uuid, email text)
language sql stable security definer set search_path = public as $$
    select u.id, u.email::text from auth.users u
    join workspace_members m on m.user_id = u.id
    where m.workspace_id = ws_id and public.is_workspace_member(ws_id)
$$;
```

Prefer adding this function — showing emails is the obviously-right UX. Call it via `ctx.supabase.rpc('workspace_member_emails', { ws_id: ctx.workspaceId })` and join client-side.

- [ ] **Step 3: Members panel (client component)**

Create `app/dashboard/settings/members.tsx` — a client component that renders: a members table (email/you-label, role select calling `updateMemberRole`, remove button calling `removeMember`, both only when `isOwner` and not the current user), a pending-invites list (email, role, copy-link button copying `${window.location.origin}/invite/${token}`, revoke button), and an invite form (email input + role select + submit calling `createInvite`, then showing the copyable link). Use existing `components/ui/` primitives (Button, Input, Select, Table if present). Keep it plain — match the visual style of the contacts page tables. This is the one place in the plan where exact JSX is left to the implementer's judgment because it's pure presentational composition of existing primitives around the five actions above; all behavior is specified.

- [ ] **Step 4: Build, manual check, commit**

Run: `npm run build` → PASS.
Manual: `npm run dev`, log in (test creds in `.env.local`), visit `/dashboard/settings`, create an invite, copy the link — verify the token URL renders.

```bash
git add app/dashboard/settings
git commit -m "Add workspace settings page with members and invites

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Workspace-scope the shared action files (mechanical pass A)

**Files:**
- Modify: `app/actions/artists.ts`, `app/actions/contacts.ts`, `app/actions/locations.ts`, `app/actions/expenses.ts`, `app/actions/acquisitions.ts`, `app/actions/valuations.ts`, `app/actions/insurance.ts`, `app/actions/loans.ts`, `app/actions/documents.ts`

Apply two transformations to every exported function in each file. The same two patterns cover all nine files.

**Pattern R (read functions** — every `get*` function):

Before:
```ts
export async function getLocations() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })
    return data || []
}
```

After:
```ts
export async function getLocations() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })
    return data || []
}
```

Rules:
- Replace `const supabase = await createClient()` with `const { supabase, workspaceId } = await getWorkspaceContext()`.
- Add `.eq('workspace_id', workspaceId)` to every **list** query (no `.eq('id', ...)`/`.single()` by unique id).
- **By-id reads** (`getLocation(id)` style, and child-row lookups like `object_acquisitions by acquisition_id`): change the client the same way but do NOT add the workspace filter — RLS scopes them, and leaving them unscoped is what lets cross-workspace deep links resolve for switching.
- Import: replace `import { createClient } from '@/lib/supabase/server'` with `import { getWorkspaceContext, requireEdit } from '@/lib/workspace'` (keep `createClient` import only if still used in the file).

**Pattern W (write functions** — every `create*`/`update*`/`delete*`/`add*`/`remove*` function):

Before:
```ts
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    ...
        user_id: user.id,
```

After:
```ts
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx
    ...
        workspace_id: workspaceId,
```

Rules:
- Every insert payload replaces `user_id: user.id` with `workspace_id: workspaceId`. Inserts into junction tables (`object_acquisitions`, `object_insurance`, `object_valuations`, `object_loans`, `entity_documents`, `object_groups`) **also** get `workspace_id: workspaceId` added (these previously had no user column).
- Updates/deletes keep their `.eq('id', id)` and rely on RLS; do not add workspace filters there.
- Write functions that contain reads (e.g. `deleteLocation` checks children/objects): the child-check queries gain `.eq('workspace_id', workspaceId)`.

- [ ] **Step 1: Transform `app/actions/locations.ts`** — functions: getLocations (R), getLocationsWithCounts (R: both the locations and objects queries get the filter), getLocation (R, by-id), createLocation (W), updateLocation (W), deleteLocation (W).
- [ ] **Step 2: Transform `app/actions/artists.ts`** — getArtists (R), getArtist (R, by-id), create (W), update (W) — read the file for exact function names; same patterns.
- [ ] **Step 3: Transform `app/actions/contacts.ts`** — list reads (R), by-id read (R), createContact (W), updateContact (W), deleteContact (W).
- [ ] **Step 4: Transform `app/actions/expenses.ts`** — list reads (R), by-id (R), create/update/delete (W).
- [ ] **Step 5: Transform `app/actions/acquisitions.ts`** — list (R), by-id + its object_acquisitions child query (R by-id), create/update/delete (W), the object_acquisitions add/remove functions (W, junction insert gains workspace_id).
- [ ] **Step 6: Transform `app/actions/valuations.ts`** — same shape as acquisitions (it has the most functions; check each `auth.getUser()` site).
- [ ] **Step 7: Transform `app/actions/insurance.ts`** — same; note its functions also touch `objects` (`is_insured` sync) — those updates are writes within W-pattern functions, leave their `.eq('id', ...)` scoping alone.
- [ ] **Step 8: Transform `app/actions/loans.ts`** — list (R, including the contacts/policies dropdown queries which get the workspace filter), by-id (R), create/update (W), object_loans add/remove (W).
- [ ] **Step 9: Transform `app/actions/documents.ts`** — reads (R), uploadDocument (W — note its R2 key becomes `${workspaceId}/documents/${Date.now()}-${file.name}`), update/delete (W), entity_documents link/unlink (W, junction insert gains workspace_id).
- [ ] **Step 10: Verify no stragglers**

Run: `grep -rn "user_id\|auth.getUser" app/actions --include='*.ts' | grep -v workspace.ts`
Expected: no matches (workspace.ts and login actions are the only remaining getUser callers; login isn't in app/actions).

- [ ] **Step 11: Build and commit**

Run: `npm run build` → PASS (these files should now typecheck against the generated types; fix any column-name typos the types surface).

```bash
git add app/actions
git commit -m "Workspace-scope all shared server actions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Workspace-scope objects actions + remove dead artworks action (mechanical pass B)

**Files:**
- Modify: `app/dashboard/objects/actions.ts`
- Delete (probably): `app/dashboard/actions.ts`
- Modify: `app/actions/upload.ts`, `app/api/upload/route.ts`, `app/api/upload-proxy/route.ts`

- [ ] **Step 1: Check `app/dashboard/actions.ts` for dead code**

Run: `grep -rn "dashboard/actions" app components --include='*.ts*'`
The file inserts into `artworks` — a table dropped before this project (commit 037f10d). If nothing imports it, `git rm app/dashboard/actions.ts`. If something imports it, replace its body to insert into `objects` using Pattern W and report the discrepancy.

- [ ] **Step 2: Transform `app/dashboard/objects/actions.ts`**

Same Patterns R/W as Task 13. Specifics in this file:
- The big list query (`.from('objects')` around line 58) and the categories/locations dropdown helpers (lines ~445, ~451) get `.eq('workspace_id', workspaceId)`.
- The object detail query (by id, ~line 186) and its child queries (object_acquisitions, object_loans, object_insurance, object_valuations, entity_documents, expenses by object_id) stay workspace-unfiltered (RLS-scoped) — Pattern R by-id.
- `createObject` (~line 459): Pattern W; the insert payload swaps `user_id: user.id` → `workspace_id: workspaceId`; the `object_dimensions` and `object_media` child inserts each gain `workspace_id: workspaceId`.
- `updateObject` (~line 352): Pattern W; the `object_media` insert (~line 403) gains `workspace_id: workspaceId`.
- `deleteObject` (~line 425): Pattern W (child deletes by object_id are fine under RLS).
- **Accession auto-numbering** (spec §3): in `createObject`, before the insert, add:

```ts
    let inventoryNumber = (formData.get('inventory_number') as string) || null
    if (!inventoryNumber) {
        const { data: ws } = await supabase
            .from('workspaces')
            .select('accession_prefix')
            .eq('id', workspaceId)
            .single()
        if (ws?.accession_prefix) {
            const year = new Date().getFullYear()
            const { count } = await supabase
                .from('objects')
                .select('id', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId)
                .like('inventory_number', `${ws.accession_prefix}-${year}-%`)
            inventoryNumber = `${ws.accession_prefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`
        }
    }
```

and use `inventory_number: inventoryNumber` in the payload. (Adapt to how the function currently reads its fields — it may take a data object rather than FormData; read the function first and keep its convention.)

- [ ] **Step 3: R2 key prefixes**

In `app/actions/upload.ts`: Pattern W (it's a write), and `const key = \`${workspaceId}/${Date.now()}-${file.name}\``.
In `app/api/upload/route.ts` and `app/api/upload-proxy/route.ts`: these are route handlers, not server actions — `getWorkspaceContext()` works there too (cookies are available). Replace the `user.id` prefix in all four key constructions (`key`, `baseKey`, `mediumKey`, `thumbnailKey`) with `workspaceId`, and the `if (!user)` 401 guard with try/catch around `getWorkspaceContext()` returning 401, plus a 403 if `ctx.role === 'viewer'`.

- [ ] **Step 4: Status value sweep**

Run: `grep -rn "'Available'\|'Current'\|object_status" app lib components --include='*.ts*'`
For each hit: `object_status` references are removed (column dropped); old `status` literals map to the new lifecycle values (`'Available'` → `'in_collection'`). Update `lib/constants.ts`: replace any object-status constant with:

```ts
export const OBJECT_STATUSES = [
    'in_collection',
    'on_loan',
    'on_consignment',
    'sold',
    'traded',
    'gifted',
    'donated',
    'lost',
    'destroyed',
    'deaccessioned',
] as const

export const OBJECT_STATUS_LABELS: Record<string, string> = {
    in_collection: 'In collection',
    on_loan: 'On loan',
    on_consignment: 'On consignment',
    sold: 'Sold',
    traded: 'Traded',
    gifted: 'Gifted',
    donated: 'Donated',
    lost: 'Lost',
    destroyed: 'Destroyed',
    deaccessioned: 'Deaccessioned',
}
```

Update any form `<Select>` that offered the old status values to iterate `OBJECT_STATUSES` rendering `OBJECT_STATUS_LABELS[s]`.

- [ ] **Step 5: Final straggler check, build, commit**

Run: `grep -rn "user_id\|auth.getUser" app --include='*.ts*' | grep -v "login\|lib/workspace"`
Expected: no matches outside `app/login/` (login legitimately uses auth directly).
Run: `npm run build && npm run lint` → both PASS, no remaining type errors.

```bash
git add -A
git commit -m "Workspace-scope objects actions, upload routes, and status values

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: End-to-end RLS + advisor verification

**Files:** none

- [ ] **Step 1: Re-run the RLS SQL test** (Task 8 file) via MCP `execute_sql` → passes.
- [ ] **Step 2: Run advisors** (`get_advisors` security + performance) → no ERROR-level findings; list WARNs in the report.
- [ ] **Step 3: Two-browser smoke test**

With `npm run dev`:
1. Log in as the test user → personal workspace auto-created (check sidebar shows workspace name; `select * from workspaces` via MCP `execute_sql` shows 1 row).
2. Create an artist, a location, an object with an image, an acquisition linked to the object, an expense, an insurance policy + object link, a valuation, a loan, a contact, a document. Each appears in its list page.
3. In Settings, invite a second email as **viewer**, copy the link. (If no second test account exists, create one in the Supabase dashboard or via MCP `execute_sql`/auth admin, then open the invite link in an incognito window logged in as that user.)
4. As the viewer: data is visible; attempting a create (e.g. new contact) fails with the read-only error.
5. As the viewer, switch to their personal workspace: empty inventory — no leakage.

- [ ] **Step 4: Verify activity log captured the session**

MCP `execute_sql`: `select action, entity_type, count(*) from activity_log group by 1, 2 order by 3 desc;`
Expected: rows for the inserts from step 3.

---

### Task 16: Final build gate and wrap-up

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md**

Update the Database Tables section to summarize the new model (workspaces + membership/RLS pattern, registrar tables, migrations in `supabase/migrations/`, types in `lib/database.types.ts`, `getWorkspaceContext()` as the mandatory server-action pattern, R2 keys prefixed by workspace id). Keep it brief — same style as the existing file.

- [ ] **Step 2: Full verification**

Run: `npm run build && npm run lint`
Expected: PASS / PASS. Re-run the Task 13/14 straggler greps → clean.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "Update CLAUDE.md for workspace architecture and new schema

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-review notes (completed)

- **Spec coverage:** tenancy (§1 → Tasks 3, 10–12), registrar tables (§2 → Tasks 4–5), lifecycle/status cleanup + accession numbering (§3 → Task 14), migrations/tooling/app adaptation/verification (§4 → Tasks 2, 7–9, 13–16). Deep-link auto-switch is implemented as "by-id reads are RLS-wide" (Tasks 13–14) — full auto-switch UI deferred; the switcher covers the workflow.
- **Known judgment calls flagged inline:** `createWorkspace` RLS bootstrap (RPC fallback provided), `workspace_member_emails` function (recommended), login `next` param (optional), Task 9 build-order variation.
- **Type consistency:** `getWorkspaceContext`/`requireEdit`/`requireOwner`/`WORKSPACE_COOKIE` names used identically across Tasks 10–14; role strings `owner|editor|viewer` everywhere; status enum matches between migration (Task 4) and constants (Task 14).
