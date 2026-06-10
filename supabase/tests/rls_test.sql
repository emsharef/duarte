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
