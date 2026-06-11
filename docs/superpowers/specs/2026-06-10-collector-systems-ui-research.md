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

## Grid customization & linked columns

The column-settings dialog (gear on any list) is a dual-list picker: "Available columns" → "Columns to display" with reorder arrows, plus items-per-page. The available list is the killer feature — it includes:

- **Linked columns from related tables**: Acquired From Contact Name, Artist First/Last/Nationality/Gender/Locale/Pronoun, etc.
- **Computed "Current …" rollups**: Current Condition Rating/Reason/Status (from the latest condition report), Current Domestic Value / High / Low / Insured Value (from the latest valuation + insurance link, converted to home currency).
- **FX metadata**: Acquisition Conversion Rate, Acquisition Date of Conversion Rate, Acquisition Funding, Approval Date…

Duarte equivalent: a per-workspace saved column config per list view (columns + order + page size), with a curated catalog of joinable/computed columns (artist fields, latest-valuation value, latest-condition rating, acquisition price/total in original + home currency). The "Current X" rollups are the high-value part — implement as SQL views or computed selects.

## Currency handling (verified on live data)

- Every money-bearing record stores **original currency amount** (¥92,000, £29,750, €7,500) plus a **conversion rate captured at the transaction date** ("Acquisition Conversion Rate" + "Date of Conversion Rate").
- A workspace-level **Default Currency** (Account Settings → Customize) defines the "Domestic" currency; every grid can show both the original amount and the Domestic conversion (e.g. ¥92,000 → $613.64), and **column totals sum in domestic currency**.
- Acquisitions also carry Jurisdiction Country (tax context), Invoice Number, Approval Date, Funding/Funding Source/Restrictions (institutional; duarte can skip funding).
- Duarte already has `currency`, `base_currency`, `exchange_rate` on acquisitions — Phase 2 should (a) add a workspace `default_currency`, (b) extend the currency+rate pattern to disposals/valuations/expenses/insurance, (c) auto-fill the rate from a historical FX API at entry (CS integrates Open Exchange), (d) always render original + converted.

## Batch operations (selection toolbar)

Selecting rows (per-row checkbox; select-all dropdown offers All / Page / None; selected rows highlight with an "N items selected" banner) reveals a delete icon, report icon, and a **More ▾** menu:

- **Labels** — print labels for the selection
- **Export With Image / Export Without Image**
- **Batch Update Location/Inventory** — bulk move + log an inventory check
- **Batch Update** — generic field-level bulk edit
- **Permissions** — per-object access control (duarte: out of scope; roles are workspace-level)
- **Add To Acquisition / Consignment / Exhibition / Group / Insurance / Loan / Publication** — attach the selection to any event record. This one menu IS the bulk-ops spec: "assign to group" generalizes to every junction table.

## Locations & settings details

- Locations page = expandable tree with per-node aggregate Object Count, inline Add Sub-Location / Edit / Delete per row, and a Labels button. Sort order via numeric name prefixes ("01. Living Room"). Pragmatic virtual locations in real use: "On Loan", "Storage", "Other", other residences.
- Account Settings → Customize: Web logo (white-label gallery), **Default Currency**, language, **Imperial/Metric preference**, geo-coordinate format; then the custom-fields builder — typed **User Defined fields** (Text, Rich Text, Date, **Currency**, Number, **Controlled Vocab**) scoped per entity (object + Acquisition/Expense/Sale/Conservation/Condition/Contact/Artist/Author). Validates duarte's `custom_field_definitions(entity_type, field_type)` design; add `currency` and `controlled_vocab` to our field_type enum.
- Multi-tenancy: "Subscriptions" list (account can hold several collections) with per-subscription storage size; Account Access tab for sharing.

## Priority takeaways for Phase 2

1. Object detail = header summary card + counted tab strip; record prev/next paging.
2. List pages = status buckets + tree filters in a left rail; money-column totals; table/gallery toggle.
3. Add `incoming` to the object status enum.
4. Auto-suggest subject names ("YYYYMMDD Counterparty") on acquisitions/disposals/valuations/loans forms.
5. Show discount as amount + computed %.
6. Linked-record fields render as links everywhere (artist, location, contact, collection).
