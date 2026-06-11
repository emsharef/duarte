# Collector Systems UI Research (Phase 2 input)

Notes from a guided read-only walkthrough of the owner's live Collector Systems account (app.collectorsystems.com, 190 objects), 2026-06-10. These are the UI patterns worth adopting (or consciously skipping) for duarte's Phase 2 module-parity work.

## Top-level navigation

Single tab row: Objects, Artists, Locations, Collections, Contacts, Exhibitions, Publications, Acquisitions, Sales, Groups, Valuations, Consignments, Insurance, Loans, Shipments, Trends, Calendar. Flat — no nesting. Duarte's sidebar equivalent is fine; Phase 2 adds Exhibitions, Sales (disposals), Consignments, Shipments, and eventually Trends/Calendar entries.

## Object list page

- **Left rail**: status buckets with counts — `Current (190)`, `Deaccessioned (2)`, `Incoming (11)` — plus collapsible tree filters: Artists, Collections, Locations.
- **Incoming** is a real lifecycle state (objects en route / pre-accession). Consider adding `incoming` to duarte's status enum in Phase 2.
- **Search**: scope dropdown (`All` or a specific field) + text box.
- **Table**: thumbnail + inventory number, artist + dates, title, year, object type, medium, imperial dims, full location path (e.g. "24 Pinehurst - 09. Guest Bath"), location status (Verified), acquisition date, current value, domestic value, acquisition price... Columns configurable (gear), **money columns show totals in a footer row**.
- Toolbar: select-all + dropdown, add (+), sort (A→Z), column settings, **table/gallery view toggle**. Pagination "1-190 of 190".

## Object detail page

- **Header card**: hero image left; ~3 columns of summary fields (Inventory Number, Object Status, Object Type, Location Status, Permanent Location | Location, Collection, Artist, Title, Object Date | Medium, Unique ID, Provenance, Dimensions). Linked records (artist, locations, collection) are hyperlinks.
- **Record paging** in the toolbar ("1 of 190" with prev/next) — browse objects without returning to the list.
- **Audit line** under the card: "Created on ... by ... Last modified on ... by ..." (duarte: derive from activity_log).
- Toolbar: back, add, edit (pencil), delete (trash), report, "More" dropdown.
- **Tab strip of related records, each with a count**: Notes, Dimensions(1), Components, Images(1), Documents(1), Acquisition(1), Conditions, Frame Conditions, Conservation, Inventory, Exhibitions, Expenses(1), Publications, Valuations, Sale, Loans, Shipments, Groups, Insurance, Consignments, Hazards, Environmental Conditions.
  - "Inventory" = location-verification audit events (ties to `location_status`).
  - Hazards / Environmental Conditions / Frame Conditions as separate tabs = museum-grade; duarte intentionally defers.
  - Each tab body has its own mini-toolbar (edit/export) and renders the linked record with key fields (e.g. Acquisition tab: linked acquisition name, price, discount shown as **amount and percentage**).

## Module observations

- **Sales** (= duarte `disposals`): Sale Description, Start/End dates (a sale can span dates), Sold-to contact, **Sale Type includes Gift** — one table covers sale/gift/donation outflows, validating duarte's single-disposals-table design. Also Sale Location, Sale Number, Object Count.
- **Exhibitions**: Subject (internal name) distinct from Title (display), Borrowing Institution (contact link — bridges to loans), Start/End, Location, Object Count.
- **Valuations** (live data): record-per-appraisal-event with Subject (naming convention like "Appraisal Sothebys 20190221"), Status (Closed), Value Type (Insurance), Appraiser contact, Date, Object Count (one event covers up to 84 objects). Matches duarte's valuations + object_valuations exactly.
- **Naming convention** throughout: financial/event records use a human-readable "Subject" built from date + counterparty ("20260227 JaneLombard"). Duarte already has `*_subject` columns — Phase 2 forms should auto-suggest this format.
- **Trends**: left tree = metric (Object Count, Acquisition Total, Current Value, Current Insured Value) × dimension (Acquisition Year, Artist, Collection, Location, Medium, Object Type); renders bar chart + data table. Clean blueprint for duarte's Phase 3 dashboard.
- **Calendar**: aggregated feed of dated records with per-module color-coded checkboxes (Acquisitions, Consignments, Exhibitions, Insurance Policies, Loans, Sales, Shipments, Valuations); Year/Month/Day/Week/Agenda views. Confirms duarte's "system events are queries, not rows" design.

## Priority takeaways for Phase 2

1. Object detail = header summary card + counted tab strip; record prev/next paging.
2. List pages = status buckets + tree filters in a left rail; money-column totals; table/gallery toggle.
3. Add `incoming` to the object status enum.
4. Auto-suggest subject names ("YYYYMMDD Counterparty") on acquisitions/disposals/valuations/loans forms.
5. Show discount as amount + computed %.
6. Linked-record fields render as links everywhere (artist, location, contact, collection).
