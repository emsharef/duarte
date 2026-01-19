# DūArte Enhancement Plan: Matching & Exceeding Collector Systems

## Executive Summary

This plan outlines the roadmap to transform DūArte from a basic art collection manager into a comprehensive collection management system that matches and exceeds Collector Systems' capabilities.

---

## Current State Analysis

### DūArte Current Tables
- `objects` - Basic artwork info (title, artist_id, status, year, description)
- `artists` - First/last name, company, bio, birth/death year, nationality, website, aka
- `locations` - Hierarchical (name, parent_id, type)
- `categories` - Hierarchical grouping
- `groups` - Simple grouping
- `object_dimensions` - Height, width, depth, unit
- `object_media` - Images with thumbnails

### Collector Systems Features (Target)
- 182 objects with 20+ fields each
- 137 artists with comprehensive biographical data
- 125 acquisitions tracked
- 7 valuations/appraisals
- 4 loans (in/out)
- 2 insurance policies
- Exhibitions, publications, consignments, shipments, sales
- Comprehensive contacts database
- Report generation
- Full audit history

---

## Phase 1: Enhanced Object Data Model

### 1.1 Extended Object Fields
Add these columns to `objects` table:

```sql
-- Identification
inventory_number text unique,
object_type text,              -- Painting, Sculpture, Print, Jewelry, etc.
unique_id text,                -- External tracking ID

-- Physical Description
medium text,                   -- Materials (oil on canvas, bronze, etc.)
edition text,                  -- e.g., "3/25" or "Artist Proof"
signature_info text,           -- Signed, dated, inscribed details
inscription text,

-- Location Tracking
permanent_location_id uuid,    -- Where it normally lives
current_location_id uuid,      -- Where it is now
location_status text,          -- Verified, Unverified, On Loan

-- Provenance & History
provenance text,               -- Full provenance chain
exhibition_history text,
literature text,               -- Published references

-- Condition
condition_summary text,
frame_condition text,

-- Financial (metadata only, not sensitive)
currency text default 'USD',

-- Status & Workflow
object_status text default 'Current',  -- Current, Deaccessioned, Incoming
is_insured boolean default false,
```

### 1.2 New Object Sub-Tables

```sql
-- Condition Reports (multiple over time)
create table object_conditions (
  id uuid primary key,
  object_id uuid references objects(id),
  condition_date date,
  examiner text,
  overall_condition text,      -- Excellent, Good, Fair, Poor
  condition_notes text,
  recommendations text,
  created_at timestamp
);

-- Frame/Mount Conditions
create table object_frame_conditions (
  id uuid primary key,
  object_id uuid references objects(id),
  has_frame boolean,
  frame_description text,
  frame_condition text,
  frame_notes text,
  created_at timestamp
);

-- Components (for multi-part objects)
create table object_components (
  id uuid primary key,
  object_id uuid references objects(id),
  component_name text,
  description text,
  created_at timestamp
);

-- Hazards/Special Handling
create table object_hazards (
  id uuid primary key,
  object_id uuid references objects(id),
  hazard_type text,            -- Fragile, Light Sensitive, Climate Sensitive
  handling_instructions text,
  created_at timestamp
);

-- Environmental Requirements
create table object_environmental (
  id uuid primary key,
  object_id uuid references objects(id),
  min_temperature numeric,
  max_temperature numeric,
  min_humidity numeric,
  max_humidity numeric,
  light_level_lux numeric,
  notes text,
  created_at timestamp
);
```

---

## Phase 2: Enhanced Artist Model

### 2.1 Extended Artist Fields
Add to `artists` table:

```sql
-- Identity
alias_first text,
alias_last text,
gender text,
race text,
ethnicity text,

-- Career
artist_locale text,            -- Where they worked (can be multiple places)
school_movement text,          -- Impressionism, Abstract Expressionism, etc.
active_years text,             -- e.g., "1950-1980"

-- External References
ulan_id text,                  -- Getty Union List of Artist Names
wikidata_id text,
artist_link text,              -- Primary external URL

-- Extended Bio
full_biography text,
awards text,
education text,
represented_by text,           -- Galleries
```

### 2.2 Artist Sub-Tables

```sql
-- Artist Alternate Names
create table artist_aliases (
  id uuid primary key,
  artist_id uuid references artists(id),
  alias_type text,             -- Maiden name, Pseudonym, etc.
  name text,
  created_at timestamp
);

-- Artist Exhibitions (reference only)
create table artist_exhibitions (
  id uuid primary key,
  artist_id uuid references artists(id),
  exhibition_name text,
  venue text,
  year integer,
  is_solo boolean,
  created_at timestamp
);
```

---

## Phase 3: Contacts & Organizations

### 3.1 Contacts Table
Central table for all people/organizations:

```sql
create table contacts (
  id uuid primary key,
  user_id uuid references auth.users not null,

  -- Type
  contact_type text,           -- Person, Gallery, Auction House, Museum, Appraiser, etc.

  -- Name
  first_name text,
  last_name text,
  company_name text,
  display_name text,           -- Computed or override

  -- Contact Info
  email text,
  phone text,
  mobile text,
  fax text,
  website text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,

  -- Notes
  notes text,

  -- Status
  is_active boolean default true,

  created_at timestamp,
  updated_at timestamp
);
```

---

## Phase 4: Financial Tracking

### 4.1 Acquisitions

```sql
create table acquisitions (
  id uuid primary key,
  user_id uuid references auth.users not null,

  -- Identity
  acquisition_subject text,    -- Name/reference for this acquisition
  acquisition_date date,

  -- Source
  acquired_from_contact_id uuid references contacts(id),
  acquisition_type text,       -- Purchase, Gift, Bequest, Exchange, etc.

  -- Buyer
  bought_by_contact_id uuid references contacts(id),

  -- Financial
  acquisition_price numeric,
  currency text default 'USD',
  acquisition_discount numeric,
  buyer_premium numeric,
  taxes numeric,
  total_cost numeric,

  -- Documentation
  invoice_number text,
  invoice_date date,
  lot_number text,

  -- Notes
  notes text,

  created_at timestamp
);

-- Link objects to acquisitions
create table object_acquisitions (
  object_id uuid references objects(id),
  acquisition_id uuid references acquisitions(id),
  object_price numeric,        -- Price for this specific object in batch
  primary key (object_id, acquisition_id)
);
```

### 4.2 Sales

```sql
create table sales (
  id uuid primary key,
  user_id uuid references auth.users not null,

  sale_subject text,
  sale_date date,

  -- Buyer
  sold_to_contact_id uuid references contacts(id),
  sale_type text,              -- Private Sale, Auction, Consignment, etc.

  -- Financial
  sale_price numeric,
  currency text default 'USD',
  commission numeric,
  net_proceeds numeric,

  -- Documentation
  invoice_number text,

  notes text,
  created_at timestamp
);

create table object_sales (
  object_id uuid references objects(id),
  sale_id uuid references sales(id),
  object_price numeric,
  primary key (object_id, sale_id)
);
```

### 4.3 Valuations/Appraisals

```sql
create table valuations (
  id uuid primary key,
  user_id uuid references auth.users not null,

  valuation_subject text,      -- Name for this valuation batch
  valuation_date date,
  valuation_status text,       -- Pending, Closed

  -- Appraiser
  appraiser_contact_id uuid references contacts(id),

  -- Type
  value_type text,             -- Insurance, Fair Market, Retail Replacement

  -- Totals
  total_value numeric,
  currency text default 'USD',

  notes text,
  created_at timestamp
);

create table object_valuations (
  id uuid primary key,
  object_id uuid references objects(id),
  valuation_id uuid references valuations(id),

  appraised_value numeric,
  low_estimate numeric,
  high_estimate numeric,

  notes text,
  created_at timestamp
);
```

### 4.4 Insurance

```sql
create table insurance_policies (
  id uuid primary key,
  user_id uuid references auth.users not null,

  policy_subject text,         -- Name/description
  policy_number text,

  -- Insurer
  insurer_contact_id uuid references contacts(id),

  -- Coverage Period
  start_date date,
  end_date date,

  -- Coverage
  coverage_type text,          -- Blanket, Scheduled
  total_coverage numeric,
  deductible numeric,
  premium numeric,
  currency text default 'USD',

  notes text,
  is_active boolean default true,
  created_at timestamp
);

create table object_insurance (
  object_id uuid references objects(id),
  policy_id uuid references insurance_policies(id),
  insured_value numeric,
  primary key (object_id, policy_id)
);
```

### 4.5 Expenses

```sql
create table expenses (
  id uuid primary key,
  user_id uuid references auth.users not null,
  object_id uuid references objects(id),

  expense_type text,           -- Framing, Conservation, Shipping, Storage, etc.
  expense_date date,
  vendor_contact_id uuid references contacts(id),

  amount numeric,
  currency text default 'USD',

  description text,
  invoice_number text,

  created_at timestamp
);
```

---

## Phase 5: Loans & Movement

### 5.1 Loans

```sql
create table loans (
  id uuid primary key,
  user_id uuid references auth.users not null,

  loan_subject text,
  loan_direction text,         -- 'in' or 'out'

  -- Parties
  borrower_contact_id uuid references contacts(id),
  lender_contact_id uuid references contacts(id),

  -- Exhibition (if applicable)
  exhibition_name text,
  venue text,

  -- Dates
  loan_start_date date,
  loan_end_date date,
  actual_return_date date,

  -- Insurance
  insurance_value numeric,
  insurance_policy_id uuid references insurance_policies(id),

  -- Status
  loan_status text,            -- Pending, Active, Returned, Overdue

  -- Documents
  loan_agreement_r2_key text,

  notes text,
  created_at timestamp
);

create table object_loans (
  object_id uuid references objects(id),
  loan_id uuid references loans(id),
  loan_value numeric,
  condition_out text,
  condition_in text,
  primary key (object_id, loan_id)
);
```

### 5.2 Shipments

```sql
create table shipments (
  id uuid primary key,
  user_id uuid references auth.users not null,

  shipment_subject text,
  shipment_date date,

  -- Parties
  shipper_contact_id uuid references contacts(id),  -- Shipping company
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),

  -- Details
  tracking_number text,
  carrier text,
  shipping_method text,        -- Ground, Air, Courier

  -- Cost
  shipping_cost numeric,
  insurance_value numeric,

  -- Status
  shipment_status text,        -- Scheduled, In Transit, Delivered
  delivery_date date,

  notes text,
  created_at timestamp
);

create table object_shipments (
  object_id uuid references objects(id),
  shipment_id uuid references shipments(id),
  primary key (object_id, shipment_id)
);
```

### 5.3 Consignments

```sql
create table consignments (
  id uuid primary key,
  user_id uuid references auth.users not null,

  consignment_subject text,
  consignee_contact_id uuid references contacts(id),  -- Gallery, auction house

  start_date date,
  end_date date,

  commission_rate numeric,     -- Percentage
  reserve_price numeric,

  consignment_status text,     -- Active, Sold, Returned

  notes text,
  created_at timestamp
);

create table object_consignments (
  object_id uuid references objects(id),
  consignment_id uuid references consignments(id),
  asking_price numeric,
  sold_price numeric,
  primary key (object_id, consignment_id)
);
```

---

## Phase 6: Events & History

### 6.1 Exhibitions

```sql
create table exhibitions (
  id uuid primary key,
  user_id uuid references auth.users not null,

  exhibition_name text not null,
  venue_contact_id uuid references contacts(id),

  start_date date,
  end_date date,

  exhibition_type text,        -- Solo, Group, Museum, Gallery
  curator text,

  catalog_published boolean,
  catalog_r2_key text,

  notes text,
  created_at timestamp
);

create table object_exhibitions (
  object_id uuid references objects(id),
  exhibition_id uuid references exhibitions(id),
  catalog_number text,
  displayed boolean default true,
  primary key (object_id, exhibition_id)
);
```

### 6.2 Publications

```sql
create table publications (
  id uuid primary key,
  user_id uuid references auth.users not null,

  title text not null,
  author text,
  publication_date date,
  publisher text,
  publication_type text,       -- Book, Catalog, Article, etc.

  isbn text,
  pages text,

  r2_document_key text,

  notes text,
  created_at timestamp
);

create table object_publications (
  object_id uuid references objects(id),
  publication_id uuid references publications(id),
  page_reference text,
  plate_number text,
  is_illustrated boolean,
  primary key (object_id, publication_id)
);
```

### 6.3 Conservation

```sql
create table conservation_records (
  id uuid primary key,
  user_id uuid references auth.users not null,
  object_id uuid references objects(id),

  conservator_contact_id uuid references contacts(id),

  treatment_date date,
  treatment_type text,         -- Cleaning, Restoration, Stabilization

  condition_before text,
  treatment_description text,
  condition_after text,

  cost numeric,

  -- Documentation
  report_r2_key text,
  before_image_r2_key text,
  after_image_r2_key text,

  notes text,
  created_at timestamp
);
```

### 6.4 Activity Log / Audit Trail

```sql
create table activity_log (
  id uuid primary key,
  user_id uuid references auth.users not null,

  entity_type text,            -- object, artist, acquisition, etc.
  entity_id uuid,

  action text,                 -- created, updated, deleted, viewed
  changes jsonb,               -- What changed

  created_at timestamp default now()
);
```

---

## Phase 7: Documents & Media

### 7.1 Enhanced Document Storage

```sql
create table documents (
  id uuid primary key,
  user_id uuid references auth.users not null,

  document_type text,          -- Invoice, Certificate, Appraisal, Correspondence, etc.
  document_name text,
  description text,

  r2_key text not null,
  file_size integer,
  mime_type text,

  -- Date of document (not upload date)
  document_date date,

  created_at timestamp
);

-- Link documents to any entity
create table entity_documents (
  document_id uuid references documents(id),
  entity_type text,            -- object, acquisition, loan, etc.
  entity_id uuid,
  primary key (document_id, entity_type, entity_id)
);
```

---

## Phase 8: Collections & Grouping

### 8.1 Named Collections

```sql
create table collections (
  id uuid primary key,
  user_id uuid references auth.users not null,

  name text not null,
  description text,

  -- Hierarchy
  parent_id uuid references collections(id),

  -- Display
  cover_image_r2_key text,

  is_public boolean default false,

  created_at timestamp
);

create table object_collections (
  object_id uuid references objects(id),
  collection_id uuid references collections(id),
  sort_order integer,
  primary key (object_id, collection_id)
);
```

---

## Phase 9: Reports & Export

### 9.1 Report Templates

```sql
create table report_templates (
  id uuid primary key,
  user_id uuid references auth.users not null,

  name text not null,
  report_type text,            -- Inventory, Insurance, Loan, Valuation, etc.

  -- Configuration
  columns jsonb,               -- Which fields to include
  filters jsonb,               -- Default filters
  sort_order jsonb,

  -- Branding
  header_text text,
  footer_text text,
  logo_r2_key text,

  created_at timestamp
);
```

### 9.2 Report Generation Features
- PDF export with images
- Excel/CSV export
- Insurance schedules
- Loan agreements
- Condition reports
- Collection catalogs
- Valuation summaries
- Location inventory lists

---

## Phase 10: UI/UX Enhancements

### 10.1 New Pages Required
1. **Objects** - Enhanced detail view with all tabs
2. **Artists** - Full biographical editor
3. **Contacts** - Contact management
4. **Acquisitions** - Purchase tracking
5. **Sales** - Sale management
6. **Valuations** - Appraisal management
7. **Insurance** - Policy management
8. **Loans** - Loan in/out management
9. **Exhibitions** - Exhibition tracking
10. **Conservation** - Treatment records
11. **Shipments** - Movement tracking
12. **Reports** - Report builder/generator
13. **Collections** - Named collection management
14. **Settings** - Custom fields, preferences

### 10.2 Object Detail Tabs
Match Collector Systems' tabbed interface:
- Notes
- Dimensions
- Components
- Images
- Documents
- Acquisition
- Conditions
- Frame Conditions
- Conservation
- Inventory
- Exhibitions
- Expenses
- Publications
- Valuations
- Sale
- Loans
- Shipments
- Groups
- Insurance
- Consignments
- Hazards
- Environmental Conditions

---

## Implementation Priority

### MVP (Immediate Value)
1. Enhanced object fields
2. Contacts table
3. Acquisitions
4. Insurance policies
5. Valuations

### High Priority
6. Loans management
7. Document storage
8. Conservation records
9. Expenses tracking

### Medium Priority
10. Exhibitions
11. Publications
12. Shipments
13. Collections
14. Activity log

### Future Enhancement
15. Report generation
16. Consignments
17. Advanced search
18. Bulk operations
19. API access
20. Mobile app

---

## Technical Considerations

### Database
- All new tables need RLS policies matching existing pattern
- Add proper indexes for foreign keys and common queries
- Consider partitioning for activity_log if it grows large

### API/Actions
- Create server actions for each new entity type
- Implement proper validation with Zod schemas
- Add revalidation for related pages

### UI Components
- Reusable entity forms
- Tabbed detail views
- Searchable dropdowns for contacts
- Date pickers
- Currency inputs
- File upload handlers

### Migration Strategy
- Each phase can be independent migration script
- Run migrations in sequence
- Add UI features incrementally after each DB phase

---

## Success Metrics

- Match all Collector Systems entity types
- Support 1000+ objects with sub-second queries
- Full audit trail for compliance
- Professional report output quality
- Mobile-responsive interface

---

*Document Version: 1.0*
*Created: January 2026*
