# Phase 2: Interaction Model & Object Experience — Design

**Date:** 2026-06-10
**Status:** Approved (pending user review of this document)
**Inputs:** `2026-06-10-collector-systems-ui-research.md`, `2026-06-10-arternal-ui-research.md`, Phase 1 spec/plan

## Context & scope decision

Phase 1 delivered the workspace-tenant foundation and full registrar schema. The original roadmap put module UIs in Phase 2, but after researching Collector Systems and Arternal the user chose **interaction model first**: rebuild the object experience and list pages to the best-of-both-worlds standard, so every later module lands inside the right container. New registrar module UIs (disposals, exhibitions, condition reports, provenance editor, consignments, shipments) move to Phase 3.

**Approach chosen (B, hybrid):** keep routed pages (no master-detail rewrite); rebuild the object detail page as a Collector-Systems-style header card + counted tab strip with Arternal-style inline editing; rebuild list pages with filter rail, column customization, saved views, money totals, batch tray, and inline status chips.

## 1. Object detail page

### Header card
- Hero image (primary media; click opens a lightbox gallery of all media), title / artist / year prominent.
- Key fields in columns: inventory #, lifecycle status (colored chip, inline-editable dropdown), object type, category, current location, permanent location, medium, dimensions summary, current value (latest valuation, domestic currency).
- Every linked record (artist, locations, category, lists) renders as a link.
- **Prev/next paging** through the object set from the list the user came from (filter context carried in a query param; falls back to workspace-wide created_at order).
- **Caption block** (Arternal pattern): artist, *title*, year, medium, dims (in + cm), inventory #, price-optional — with a **Copy Caption** button (writes plain text to clipboard).
- Audit line ("Created … · Last modified … by …") derived from activity_log.

### Tab strip (counted)
Tabs: **Info · Images(n) · Dimensions(n) · Acquisition(n) · Valuations(n) · Insurance(n) · Loans(n) · Expenses(n) · Documents(n) · Lists(n) · Activity**. Counts query in one round trip. The strip is data-driven (array of tab configs) so Phase 3 modules (Conditions, Exhibitions, Provenance, Disposals, Consignments, Shipments) register as new entries without layout work.

- **Info tab**: full cataloguing field set with **per-field inline editing** — click value → input → save on blur/Enter, Escape cancels; optimistic update with error rollback; `updateObjectFields(id, patch)` server action (requireEdit; one action, partial patch). Viewers (role) see plain text. Field groups: Identity (inventory #, additional ids/previous id, credit line), Cataloguing (title, alternate title, date_text + year, medium, type, category, country of origin, edition number/size/type, suite/portfolio, catalogue raisonné), Physical (dimensions list, framing, signature, inscription), Texts (description, provenance fallback text, condition summary), Custom fields.
- **Related-record tabs** (Acquisition, Valuations, Insurance, Loans, Expenses, Documents, Lists): rows of linked records with key fields; **add/edit/unlink happen in dialogs over the page** (no navigation): e.g. "Add valuation" opens a dialog with the valuation picker (link existing or create minimal) + per-object value fields; saving calls the existing module server actions and refreshes the tab. Each row links out to the owning module page for deep work.
- **Images tab**: grid of media with upload (existing pipeline), set-primary, name/description edit in dialog, delete.
- **Dimensions tab**: inline add/edit rows (type, h/w/d, unit).
- **Activity tab**: timeline rendered from `activity_log` for this object — filter chips (All / Edits / Valuations / Loans / Insurance / …), each entry shows author, timestamp, and field-level diff summary computed from the stored `changes` jsonb.

## 2. List pages (inventory first, pattern shared)

### Inventory (`/dashboard`)
- **Left rail**: status buckets with counts — **Current** (in_collection, on_loan, on_consignment), **Incoming** (incoming), **Former** (sold, traded, gifted, donated, deaccessioned, lost, destroyed) — plus collapsible filter trees: Artists, Locations (hierarchical), Categories, Lists. Selecting filters composes with search.
- **Toolbar**: scoped search (field dropdown + text), column-settings button, table/gallery view toggle, pagination.
- **Column system**: dual-list settings dialog (available ↔ displayed, reorder, items per page). Column catalog includes object fields plus **linked/computed columns**: artist name, full location path, category, acquisition price (original currency) and acquisition price (domestic), current value (latest valuation, domestic), insured value (sum of policy links), list memberships. Backed by a single Postgres view `objects_grid` (one row per object, lateral joins for latest valuation etc.) so the page is one query. Money columns render original currency where applicable and total in the **workspace default currency** in a footer row.
- **Saved views**: `saved_views` table (id, workspace_id, user_id, entity_type, name, config jsonb {columns, sort, pageSize, filters}, is_default). Column dialog gains "Save as view"; a view switcher sits in the toolbar. Views are per-user; a workspace-shared flag is future work.
- **Selection & tray**: row checkboxes + select all/page/none; selected ids persist in a context store backed by sessionStorage; a tray chip in the top bar shows the count everywhere. Batch actions (toolbar appears on selection): set status, set location, add to list, export CSV (current columns), delete (confirm). "Add to acquisition/exhibition/…" arrives with Phase 3 modules.
- **Inline status chips** in rows (same component as detail header).
- **Gallery view**: card grid (image, title, artist, status chip) sharing the same data/filters.
- Other module list pages (contacts, acquisitions, valuations, insurance, loans, documents, expenses) adopt the same toolbar/components with smaller column catalogs and no rail trees (status buckets where applicable, e.g. loans by status).

## 3. Schema migration (0700_phase2_interaction)

- `objects`: add `date_text text`, `credit_line text`, `alternate_title text`, `country_of_origin text`, `suite_portfolio text`, `catalogue_raisonne text`, `previous_id text`; extend status check constraint with `'incoming'`.
- `workspaces`: add `default_currency text not null default 'USD'`.
- Add `exchange_rate numeric` (rate → workspace default currency at the record's date) to: `disposals`, `expenses`, `valuations`, `insurance_policies`, `conservation_treatments`, `shipments`, `loans`. (`acquisitions` already has it.)
- `object_groups`: add `sort_order integer not null default 0` — groups surface in the UI as ordered **Lists**.
- `custom_field_definitions`: extend field_type check with `'currency'`, `'controlled_vocab'`.
- New `saved_views` table (above) with standard workspace RLS.
- Regenerate `lib/database.types.ts`.

## 4. FX helper

`lib/fx.ts`: `getHistoricalRate(from, to, date)` calling the Frankfurter API (`api.frankfurter.dev/v1/{date}?base={from}&symbols={to}` — ECB data, free, no key), with in-memory memoization and graceful failure (return null → rate field left blank, user can fill manually). Money forms auto-fill `exchange_rate` when currency ≠ workspace default and date is set; the rate field stays visible and editable. Server-side only.

## 5. First-run & form polish

- **`CategoryPicker`** component (searchable select + inline create, same pattern as contact/location pickers) replaces blank category `<Select>`s in object forms.
- **`LocationPicker`** wired into object create/edit for both current and permanent location, with **"Set to current location" / "Set to permanent location"** cross-fill buttons (CS pattern).
- **Workspace seeding**: `ensure_personal_workspace()` and `create_workspace()` RPCs also insert a starter category set (Painting, Sculpture, Drawing, Print, Photography, Video, Mixed Media, Other) — migration updates the functions.
- Object forms gain the new cataloguing fields and edition fields; workspace settings page gains accession-prefix and default-currency settings.
- Groups pages/labels rename to **Lists** (table name unchanged); list detail supports drag-or-buttons reordering (sort_order).

## 6. Out of scope (Phase 3+)

New registrar module UIs (disposals, exhibitions, condition reports, provenance editor, consignments, shipments), dashboards/Trends, calendar/reminders UI, PDF reports & labels, CSV import, master-detail side panels, "Add to <event>" batch actions, custom-fields management UI, controlled-vocab value management.

## 7. Verification

- Gates: `npx tsc --noEmit`, `npm run build`, `npm run lint` clean; RLS SQL test re-run after migration.
- FX helper: unit check against a pinned historical date/currency pair.
- Browser smoke (dev-login): inline edit on Info tab (editor saves, viewer read-only), dialog add of valuation/insurance/loan from object tabs, list filters + column dialog + saved view round-trip, batch set-location + add-to-list via tray, CSV export, category/location inline-create from a fresh workspace (seeding visible), copy-caption.
