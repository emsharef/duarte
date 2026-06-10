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
