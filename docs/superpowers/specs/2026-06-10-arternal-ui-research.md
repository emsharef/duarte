# Arternal UI Research (Phase 2+ input)

Notes from a read-only walkthrough of a live Arternal account (app.arternal.com, ~2,469 works / 245 artists / ~3,981 contacts), 2026-06-10. Companion to the Collector Systems research doc; the closing section synthesizes "best of both worlds" for duarte.

## Design language (vs Collector Systems)

Arternal is a modern SPA: dark icon rail (Home, Mail, Contacts, Inventory, OVR, Transact, Invoices, Reports, Previews, Agents), **master-detail layouts** (list stays visible while a detail panel opens), **inline editing everywhere** (no edit mode — every field on the record is directly editable), colored status chips editable in place, and a persistent "tray" (cart) in the top bar for collecting works/contacts across pages to act on as a batch. CS by contrast is page-per-record with explicit edit forms. Duarte should take Arternal's interaction model with CS's data depth.

## Inventory

- **Artist-first hierarchy**: left rail lists artists with work counts; inventory numbers are artist-prefixed (AH.26.21). Gallery-centric; for duarte's collector use, collection-first stays right, but artist filtering this prominent is worth keeping.
- Top tabs: Works / Selections / Lists / Docs — "Lists" are saved sets of works (154 of them in live use!), the unit for OVRs, previews, and fairs.
- Row: image, artist + italic title + year, medium, dims, inventory #, price + currency, status chip (AVAILABLE/HOLD/SOLD) editable inline, tags/notes.

## Artwork record

- Header: "INV#, Artist, Title, Year" + icon actions (add-to-list, download, email, share, tray).
- Tabs: Info / Financials / Offers / Activity / Location-Condition / History / Editions / Inquiries.
- **Caption block with "Copy Caption"** under the image (artist, title, year, medium, dims in+cm, inv#, price) — the gallery's most-used artifact. Duarte should add one-click caption copy.
- **"Paste Caption" (AI)**: paste any caption text → parses into structured fields. Shipping today; cheap, high-value AI entry feature for duarte Phase 4.
- Multiple labeled prices (Default Label "Retail Price" + Add Price), multiple inventory numbers, Alt Views/Associated Views for images.
- Financials tab: purchase-type gate (Retail Acquisition vs **Consignment** — galleries' dual cost-basis), then per-artwork Transactions and Expenses ledgers.
- Location/Condition tab: Condition Log (records, PDF export), Location History, **Customs Status** (import/export paperwork state).
- **Activity tab**: per-record timeline with filter chips (Edits / Smart Mail / Clickthroughs / Holds-Solds / Transactions / Associations / Price History / Location / Consignments / OVR) showing field-level edits with author + timestamp. This is duarte's activity_log rendered right.

## Contacts (CRM)

- Lists: **Static vs Live (rule-based) segments**; real usage is event-driven ("Frieze dinner 26 invitation", "INSTITUTION FIGURES", "Interior Designer_High End").
- Profile: assignments (primary/secondary staff owner), lead status, type, tags, event roles, and **collector economics** (Total spend, Avg price point acquired, Works acquired) over a selectable time window.
- Tabs: Timeline / Offers / Notes / Inbox / Tasks / Invoice / Docs / Inventory / Inquiries. Timeline = engagement telemetry: email sent/opened/replied, link clicks (with subject lines), holds/solds, OVR views, calls.

## Agents (AI) — the Intake Agent

The blueprint for duarte Phase 4 data entry, shipping today:

- Queue UI: **Pending vs Approved**, batch select, prev/next ("6 / 6") navigation.
- Per-item review screen: **View Source** (the document/email the AI extracted from), **"N potential duplicates found" warning with Review**, image dropzone, **Extracted Fields** list (artist, title, inventory #, price, currency, year…) each editable, and **Discard / Approve** actions.
- Pattern to copy verbatim: AI never writes directly to inventory — it writes *drafts* with source links and dedup checks, humans approve.

## OVR (online viewing rooms) + Home dashboard

- OVR = shareable links built from a List of works: per-link analytics (visits, inquiries, creator, last visited), per-contact association, Copy-link, "Info Collected" (lead capture), inquiry inbox.
- Home dashboard is an **engagement** dashboard (date-range selectable, per-staffer filter): smart mail sent / clickthroughs / contacts interacted / works added / contacts added, OVR activity feed with visitor geolocation, **Most Viewed OVR Artwork with view duration**, artwork status-change feed. CS's Trends is asset-value analytics; Arternal's Home is relationship analytics. Duarte eventually wants both, value first.

## Best of both worlds → duarte

| Dimension | Take from | What |
|---|---|---|
| Interaction model | Arternal | Master-detail, inline editing, status chips, tray/batch selection |
| Data depth | Collector Systems | Registrar tabs (conditions, conservation, provenance, publications, hazards-lite), two-location model, lifecycle workflows |
| Grid power | Collector Systems | Column picker with linked + computed "Current X" columns, money totals, saved views |
| Batch ops | Both | CS's "Add To <any event>" menu + Arternal's persistent tray |
| Currency | Collector Systems | Original + domestic with transaction-date rate; workspace default currency |
| Activity/audit | Arternal | Per-record filterable timeline (we already log it; render it) |
| AI data entry | Arternal | Intake queue: source link, extracted fields, dupe warning, approve/discard. Plus "Paste Caption" |
| Captions | Arternal | Formatted caption block + Copy Caption on every object |
| Sharing | Arternal | OVR-style share links over Lists with view analytics (duarte Phase 6, but Lists should exist earlier as "groups with order") |
| Dashboards | Both | CS Trends (value) for collectors first; Arternal engagement metrics later |
| Naming | Collector Systems | "YYYYMMDD Counterparty" subjects; artist-prefixed inventory numbers from Arternal as an accession-prefix option |
