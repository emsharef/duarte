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
