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

## Add Object form (full field inventory)

Captured by opening the create form (cancelled without saving). Single long page, label-left layout, Save/Cancel at bottom. Fields in order:

**Identity & status:** Inventory Number; Object Status (dropdown, default Current); Object Type (dropdown); Credit Line; Location Status (dropdown); Permanent Location (picker with Select / Clear / **Set To Current Location**); Location (picker with Select / Clear / **Set To Permanent Location**); Inventory Date (date+time); Inventory Contact (dropdown); Inventory Memo (rich text).

**Cataloguing:** Maker; Title; Alternate Title; Object Date (free text, not just year); Medium; Form; Subject; Category/Style; Country of Origin; Edition; Suite/Portfolio; Catalog Raisonné; RFID Tag Number; **Term (Getty AAT)** — live "Search Getty Database" autocomplete; Previous ID; Purchase Price; Source File.

**Rich-text blocks** (every one a full WYSIWYG editor, some with helper tooltips): Description, Signatures, Inscriptions, Labels, Provenance, Reference Notes, Research Notes, Staff Notes.

Notes for duarte:
- The two-location cross-fill buttons (Set To Current/Permanent) are a small, high-value UX detail — adopt.
- Several fields duarte lacks and should consider in Phase 2: Credit Line, Alternate Title, Country of Origin, Suite/Portfolio, Catalogue Raisonné reference, Previous ID. (Form/Subject/Category-Style overlap with our categories+tags direction; RFID and Getty AAT are deferrable.)
- Their Object Date is free text (handles "ca. 1962") — duarte's `year_created` integer is lossy; consider adding a `date_text` display field like our provenance design.
- Distinct note fields per audience (Reference/Research/Staff) rather than one notes blob.
- duarte deliberately won't use rich-text editors for every field — plain textareas + markdown is a better fit.

## Priority takeaways for Phase 2

1. Object detail = header summary card + counted tab strip; record prev/next paging.
2. List pages = status buckets + tree filters in a left rail; money-column totals; table/gallery toggle.
3. Add `incoming` to the object status enum.
4. Auto-suggest subject names ("YYYYMMDD Counterparty") on acquisitions/disposals/valuations/loans forms.
5. Show discount as amount + computed %.
6. Linked-record fields render as links everywhere (artist, location, contact, collection).
