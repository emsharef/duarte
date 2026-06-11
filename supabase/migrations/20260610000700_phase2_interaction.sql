-- Phase 2: interaction model schema additions (spec 2026-06-10).

-- 1) Objects: cataloguing fields + 'incoming' lifecycle status.
alter table public.objects
    add column date_text text,
    add column credit_line text,
    add column alternate_title text,
    add column country_of_origin text,
    add column suite_portfolio text,
    add column catalogue_raisonne text,
    add column previous_id text;

alter table public.objects drop constraint objects_status_check;
alter table public.objects add constraint objects_status_check check (status in (
    'incoming', 'in_collection', 'on_loan', 'on_consignment', 'sold', 'traded',
    'gifted', 'donated', 'lost', 'destroyed', 'deaccessioned'));

-- 2) Workspace default (domestic) currency.
alter table public.workspaces
    add column default_currency text not null default 'USD';

-- 3) Exchange rate (record currency -> workspace default at the record's date)
--    on all money-bearing tables; acquisitions already has one.
alter table public.disposals add column exchange_rate numeric;
alter table public.expenses add column exchange_rate numeric;
alter table public.valuations add column exchange_rate numeric;
alter table public.insurance_policies add column exchange_rate numeric;
alter table public.conservation_treatments add column exchange_rate numeric;
alter table public.shipments add column exchange_rate numeric;
alter table public.loans add column exchange_rate numeric;

-- 4) Ordered lists (groups keep their table name; UI calls them Lists).
alter table public.object_groups add column sort_order integer not null default 0;

-- 5) New custom field types.
alter table public.custom_field_definitions drop constraint custom_field_definitions_field_type_check;
alter table public.custom_field_definitions add constraint custom_field_definitions_field_type_check
    check (field_type in ('text', 'number', 'date', 'boolean', 'select', 'currency', 'controlled_vocab'));

-- 6) Saved views for list pages.
create table public.saved_views (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    entity_type text not null,
    name text not null,
    config jsonb not null default '{}'::jsonb,
    is_default boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (workspace_id, user_id, entity_type, name)
);

alter table public.saved_views enable row level security;
create policy saved_views_select on public.saved_views for select
    using ((select public.is_workspace_member(workspace_id)));
create policy saved_views_insert on public.saved_views for insert
    with check ((select public.is_workspace_member(workspace_id)) and user_id = (select auth.uid()));
create policy saved_views_update on public.saved_views for update
    using (user_id = (select auth.uid()));
create policy saved_views_delete on public.saved_views for delete
    using (user_id = (select auth.uid()));
create index saved_views_workspace_idx on public.saved_views (workspace_id);
create trigger set_updated_at before update on public.saved_views
    for each row execute function public.set_updated_at();

-- 7) Starter categories seeded into new workspaces.
create or replace function public.seed_workspace_defaults(ws uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
    insert into categories (workspace_id, name)
    select ws, c from unnest(array[
        'Painting', 'Sculpture', 'Drawing', 'Print', 'Photography',
        'Video', 'Mixed Media', 'Other'
    ]) as c
    where not exists (select 1 from categories where workspace_id = ws);
end
$$;
revoke execute on function public.seed_workspace_defaults(uuid) from anon, authenticated;

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
    perform seed_workspace_defaults(ws);
    return ws;
end
$$;

create or replace function public.create_workspace(ws_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
    ws uuid;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;
    insert into workspaces (name, created_by) values (ws_name, auth.uid()) returning id into ws;
    insert into workspace_members (workspace_id, user_id, role) values (ws, auth.uid(), 'owner');
    perform seed_workspace_defaults(ws);
    return ws;
end
$$;

-- 8) Grid view: one row per object with linked/computed columns for list pages.
create or replace view public.objects_grid
with (security_invoker = true) as
select
    o.*,
    a.first_name as artist_first_name,
    a.last_name as artist_last_name,
    a.company as artist_company,
    trim(coalesce(a.first_name, '') || ' ' || coalesce(a.last_name, '')) as artist_name,
    c.name as category_name,
    l.name as location_name,
    pl.name as permanent_location_name,
    acq.object_price as acquisition_price,
    acq_h.currency as acquisition_currency,
    acq_h.exchange_rate as acquisition_exchange_rate,
    acq_h.acquisition_date,
    case when acq.object_price is not null
        then acq.object_price * coalesce(acq_h.exchange_rate, 1)
    end as acquisition_price_domestic,
    val.appraised_value as current_value,
    val_h.currency as current_value_currency,
    case when val.appraised_value is not null
        then val.appraised_value * coalesce(val_h.exchange_rate, 1)
    end as current_value_domestic,
    ins.insured_value_total
from objects o
left join artists a on a.id = o.artist_id
left join categories c on c.id = o.category_id
left join locations l on l.id = o.location_id
left join locations pl on pl.id = o.permanent_location_id
left join lateral (
    select oa.object_price, oa.acquisition_id
    from object_acquisitions oa
    join acquisitions aq on aq.id = oa.acquisition_id
    where oa.object_id = o.id
    order by aq.acquisition_date desc nulls last
    limit 1
) acq on true
left join acquisitions acq_h on acq_h.id = acq.acquisition_id
left join lateral (
    select ov.appraised_value, ov.valuation_id
    from object_valuations ov
    join valuations v on v.id = ov.valuation_id
    where ov.object_id = o.id
    order by v.valuation_date desc nulls last
    limit 1
) val on true
left join valuations val_h on val_h.id = val.valuation_id
left join lateral (
    select sum(oi.insured_value) as insured_value_total
    from object_insurance oi
    join insurance_policies ip on ip.id = oi.policy_id and ip.is_active
    where oi.object_id = o.id
) ins on true;
