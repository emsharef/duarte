# Phase 1: Foundation & Schema Rebuild — Design

**Date:** 2026-06-09
**Status:** Approved (pending user review of this document)

## Context

Duarte is an art collection management app (Next.js 16, React 19, Supabase, Cloudflare R2) being revived after a pause. The goal is rough feature parity with Collector Systems (registrar depth) and Arternal (gallery operations), then differentiation through AI capabilities ported/adapted from the Room Service project (`../arternal`): AI data entry, research/enrichment, natural-language chat+search, and valuation insights.

### Decisions made during brainstorming

- **Audience:** the owner's collection plus a known gallery/collector — real external users from day one, so multi-tenancy is foundational. No billing/onboarding polish yet.
- **Strategy:** duarte remains the system of record; Room Service's proven AI modules (vision, embeddings, hybrid search, chat tools, enrichment) get ported in later phases. Room Service itself stays Arternal-tied.
- **Tenancy:** workspaces with members and roles (owner/editor/viewer).
- **Sequencing:** registrar-first (approach A). Complete the data model and bones before AI. Arternal's CRM/sales column (pipeline, inbox, invoicing, viewing rooms) is deferred entirely to a later phase.
- **Database:** the remote Supabase project (`DuArte`, ref `acrvteypohtcmywoiudv`) is empty (0 rows everywhere). Migration 0001 drops all existing public tables and rebuilds fresh. RLS is currently disabled on 8 tables — the rebuild fixes this by construction.
- **Editions:** structured fields on `objects`, not a separate parent-work entity.
- **AI config convention:** Anthropic API direct (`@anthropic-ai/sdk`, `ANTHROPIC_API_KEY`). Phase 1 only reserves the env-var convention; no AI code.

### Roadmap (each phase gets its own spec → plan → build cycle)

1. **Foundation & schema rebuild** ← this spec
2. **Module parity** — UI for new registrar modules; full edit/delete everywhere
3. **App basics** — search/filter/saved views, dashboard analytics, bulk ops, CSV import/export, PDF reports
4. **AI pillar 1: data entry** — photo → draft object; invoice → acquisition + documents
5. **AI pillars 2–4** — embeddings/hybrid search/chat/MCP, enrichment briefs, valuation insights
6. **Gallery sales layer (later)** — scoped CRM, invoicing, viewing rooms

## Section 1 — Tenancy & access model

### Tables

- `workspaces`: id, name, created_by → auth.users, created_at. Optional settings columns added as needed (see accession numbering, Section 3).
- `workspace_members`: workspace_id, user_id, role (`owner` | `editor` | `viewer`), created_at. PK (workspace_id, user_id).
- `workspace_invites`: id, workspace_id, email, role, token, invited_by, created_at, accepted_at. When a user logs in with a matching email, membership activates. No email-sending infrastructure — invite links are shared manually.

On signup, a personal workspace is auto-created (named after the user) with the user as owner.

### Roles

- **owner** — manage members and workspace settings, plus everything editors can do.
- **editor** — full read/write on all domain data.
- **viewer** — read-only (e.g., an advisor or insurance broker).

### RLS

Every domain table (including junction tables) carries `workspace_id` so policies never join. Two security-definer helper functions, each used wrapped in `(select ...)` for plan caching:

- `is_workspace_member(ws_id uuid) returns boolean`
- `can_edit_workspace(ws_id uuid) returns boolean` (editor or owner)

Standard policy set on every table: SELECT for members; INSERT/UPDATE/DELETE for editors+. `workspaces`/`workspace_members`/`workspace_invites` get tailored policies (members read their workspaces; owners manage members/invites).

R2 storage keys move from `{user_id}/...` to `{workspace_id}/...` so files follow the same access boundary.

### Active workspace in the app

Routes stay `/dashboard/...`. The active workspace id lives in a cookie; the sidebar gets a workspace switcher. Deep links to records in another workspace the user belongs to auto-switch the cookie instead of 404ing. (Path-based `/w/[id]/...` routing can be adopted later if needed.)

### Server-side pattern

One helper, `getWorkspaceContext()`, used by every server action and page: resolves user, active workspace, and role; returns the Supabase client plus `{ workspaceId, role }`. All queries scope by `.eq('workspace_id', ...)`. Mutations check `can edit` before writing.

## Section 2 — Registrar data model additions

Conventions for all new tables: `id uuid pk default gen_random_uuid()`, `workspace_id`, `created_at`, `updated_at`, standard RLS policy set, indexes on every FK and on `workspace_id`. Junction tables follow the existing `object_*` naming.

### Structured provenance — `provenance_events`

object_id, sort_order, owner_name, owner_contact_id (optional), place, transfer_method (Purchase, Gift, Descent, Auction, Commission, Unknown, Other), date_text (fuzzy display dates like "by 1962"), year_from / year_to (optional ints for sorting), citation, notes, confidence (`documented` | `probable` | `uncertain`). The `confidence` field is where AI provenance research writes later. `objects.provenance` (text) remains as fallback notes.

### Exhibitions & publications

- `exhibitions`: title, venue_name, venue_contact_id, start_date, end_date, type (solo/group/fair/museum), notes.
- `object_exhibitions`: object_id, exhibition_id, catalogue_number, notes.
- `publications`: title, author, publisher, year, type (book/catalogue/article/online), notes.
- `object_publications`: object_id, publication_id, reference (page/plate/figure).

`objects.exhibition_history` (text) is dropped.

### Condition & conservation

- `condition_reports`: object_id, report_date, examiner_contact_id, overall_rating (Excellent/Good/Fair/Poor), context (acquisition, loan_out, loan_in, periodic, damage), summary, findings jsonb (structured per-area observations — AI-ready), loan_id (optional). Attachments via existing polymorphic `entity_documents`.
- `conservation_treatments`: object_id, start_date, end_date, conservator_contact_id, treatment_type, description, cost, currency.

### Disposals — `disposals` + `object_disposals`

Mirrors acquisitions. `disposals`: disposal_type (Sale, Trade, Gift, Donation, Loss, Destruction), disposal_date, recipient_contact_id, currency, total_proceeds, commission, invoice_number, invoice_date, notes. `object_disposals`: object_id, disposal_id, sale_price, commission. Disposing sets object status (Section 3); records are never deleted.

### Consignments — `consignments` + `object_consignments`

`consignments`: direction (in/out), consignor_contact_id, consignee_contact_id, start_date, end_date, commission_pct, terms, status (active/returned/sold/expired). `object_consignments`: object_id, consignment_id, asking_price, status. A consignment-out that sells converts to a disposal.

### Shipments — `shipments` + `object_shipments`

`shipments`: from_text, to_text, from_location_id (optional), to_location_id (optional), carrier_contact_id, ship_date, arrival_date, waybill_number, cost, currency, status, related loan_id / consignment_id / disposal_id (optional links), packing jsonb (crate/packing details — no separate crates table). `object_shipments`: object_id, shipment_id.

### Editions & components

On `objects`: edition_number (text, e.g. "3"), edition_size (int), edition_type (numbered/AP/HC/TP), keeping existing `edition` text for oddities. `object_components`: object_id, name, description, dimensions_text, condition_notes.

### Supporting tables

- `reminders`: workspace_id, title, due_date, entity_type, entity_id (both optional), status, notes. System reminders (policy expiry, loan returns, consignment expiration) are derived by queries, not stored.
- `activity_log`: workspace_id, user_id, action, entity_type, entity_id, changes jsonb, created_at. Written by a generic table trigger on domain tables.
- `custom_field_definitions`: workspace_id, entity_type, key, label, field_type, options jsonb, sort_order. Gives `objects.custom_fields` jsonb a UI contract later (UI itself is out of scope).

### Carried-over tables

All existing tables (objects, artists, contacts, locations, categories, groups, acquisitions, valuations, insurance_policies, loans, expenses, documents, entity_documents, object_media, object_dimensions and junctions) are recreated with `workspace_id` replacing `user_id`, same columns otherwise unless noted. `expenses` gains optional `conservation_treatment_id` and `shipment_id` links so costs aren't double-entered. Artists remain workspace-scoped.

## Section 3 — Object lifecycle & cleanup

`objects` currently has three status-ish columns. They become:

- `status` — lifecycle enum: `in_collection` (default), `on_loan`, `on_consignment`, `sold`, `traded`, `gifted`, `donated`, `lost`, `destroyed`, `deaccessioned`. Owning workflows set it (creating a disposal, activating/returning a loan or consignment).
- `location_status` — stays (Verified/Unverified).
- The redundant `object_status` column is dropped.

Accession numbering: `inventory_number` stays free-form; workspaces get an optional auto-numbering setting (`prefix-YYYY-NNN`) applied at object creation when the field is left blank.

## Section 4 — Tooling, migration & app adaptation

### Migrations

`supabase init`; migrations live in `supabase/migrations/` in git. Migration 0001 is a clean baseline: drop all existing public tables, create the full schema above (tenancy, helpers, all tables, RLS policies, activity-log trigger, indexes). TypeScript types generated to `lib/database.types.ts` and wired into the Supabase clients.

### App adaptation order

1. Commit the in-flight contact-picker/location-picker work as its own commit first (it is coherent and complete).
2. Apply migration 0001 to the remote project.
3. `getWorkspaceContext()` helper; signup flow creates personal workspace; workspace switcher in sidebar; minimal settings page (member list, invite by link, role assignment).
4. Mechanical pass over every server action and page: `user_id` → `workspace_id` scoping; R2 key prefix change.
5. Regenerate types; fix type errors.

### Out of scope for Phase 1

UI for the new tables (exhibitions, condition reports, disposals, consignments, shipments, provenance editor — all Phase 2), email-sending for invites, custom-fields UI, reminders UI, any AI code.

### Verification

- Automated RLS tests: two test users in separate workspaces; each must not read or write the other's rows (SQL test per table group). Supabase advisors (security + performance) run clean.
- Existing CRUD flows manually verified per module (objects with media upload, acquisitions, expenses, insurance, loans, locations, valuations, contacts, documents).
- `npm run build` and `npm run lint` pass.

**Done means:** the app works exactly as before but workspace-scoped, the complete new schema is live and typed, RLS is enforced everywhere, and migrations are in git.
