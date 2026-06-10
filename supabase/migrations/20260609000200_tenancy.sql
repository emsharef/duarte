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

-- Workspace creation (RLS-safe bootstrap of the owner membership).
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

-- Member emails for the settings page (auth.users is not client-readable).
create or replace function public.workspace_member_emails(ws_id uuid)
returns table (user_id uuid, email text)
language sql stable security definer set search_path = public as $$
    select u.id, u.email::text from auth.users u
    join workspace_members m on m.user_id = u.id
    where m.workspace_id = ws_id and public.is_workspace_member(ws_id)
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
