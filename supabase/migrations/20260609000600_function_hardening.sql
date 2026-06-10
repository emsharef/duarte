-- Advisor-driven hardening: pin search_path on trigger functions and
-- revoke anon execution of security-definer functions (they all require
-- auth.uid(), so anon access was harmless but pointless).

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
    new.updated_at = now();
    return new;
end
$$;

revoke execute on function public.is_workspace_member(uuid) from anon;
revoke execute on function public.can_edit_workspace(uuid) from anon;
revoke execute on function public.is_workspace_owner(uuid) from anon;
revoke execute on function public.ensure_personal_workspace() from anon;
revoke execute on function public.create_workspace(text) from anon;
revoke execute on function public.accept_workspace_invite(uuid) from anon;
revoke execute on function public.workspace_member_emails(uuid) from anon;

-- Trigger functions are invoked by triggers, never via RPC.
revoke execute on function public.log_activity() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
