# Entity Linkages Implementation Plan

## Current State Analysis

The database schema is well-designed with proper junction tables:
- `object_acquisitions` - Links objects to acquisitions
- `object_insurance` - Links objects to insurance policies
- `object_valuations` - Links objects to valuations
- `object_loans` - Links objects to loans
- `entity_documents` - Polymorphic document linking to any entity

**What's Missing:** The UI doesn't expose these relationships. Users can't:
- See related items on entity pages
- Link/unlink entities
- Navigate between related records
- View the full context of an artwork's history

---

## UX Vision: The Artwork as Central Hub

The **Object Detail Page** should be the central hub showing ALL related data about an artwork. Think of it like a "passport" for the artwork showing its complete history.

```
┌─────────────────────────────────────────────────────────────┐
│  OBJECT DETAIL PAGE                                          │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  [Image Gallery]              Title: Guernica                │
│                               Artist: Pablo Picasso → link   │
│                               Year: 1937                     │
│                               Status: On Loan 🔄             │
│                               Location: MoMA → link          │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  TABS: Overview | Documents | History | Financials           │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  OVERVIEW TAB:                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Acquisition │ │ Current Loan│ │ Insurance   │            │
│  │ Sotheby's   │ │ To: Met     │ │ AXA $5M     │            │
│  │ 2019 $2.1M  │ │ Due: Dec'24 │ │ Exp: Jun'25 │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  DOCUMENTS TAB:                                              │
│  📄 Certificate of Authenticity (2019)                       │
│  📄 Condition Report - Pre-loan (2024)                       │
│  📄 Invoice - Sotheby's (2019)                               │
│  [+ Add Document]                                            │
│                                                              │
│  HISTORY TAB:                                                │
│  Timeline view of: Acquisitions, Loans, Location changes,    │
│  Valuations, Condition reports                               │
│                                                              │
│  FINANCIALS TAB:                                             │
│  Valuations over time (chart), Expenses breakdown,           │
│  Insurance history, Acquisition cost                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Object Detail Page - Related Data Display
**Goal:** Show all related entities on the object detail page

#### 1.1 Update Object Query to Include Related Data
```typescript
// In app/dashboard/objects/actions.ts
export async function getObjectWithRelations(id: string) {
  const supabase = await createClient()

  // Get object with basic relations
  const { data: object } = await supabase
    .from('objects')
    .select(`
      *,
      artists (*),
      categories (*),
      locations (*),
      object_media (*),
      object_dimensions (*)
    `)
    .eq('id', id)
    .single()

  // Get acquisitions via junction table
  const { data: acquisitions } = await supabase
    .from('object_acquisitions')
    .select(`
      *,
      acquisition:acquisitions (
        *,
        acquired_from:contacts!acquired_from_contact_id (*),
        bought_by:contacts!bought_by_contact_id (*)
      )
    `)
    .eq('object_id', id)

  // Get loans via junction table
  const { data: loans } = await supabase
    .from('object_loans')
    .select(`
      *,
      loan:loans (
        *,
        borrower:contacts!borrower_contact_id (*),
        lender:contacts!lender_contact_id (*)
      )
    `)
    .eq('object_id', id)
    .order('created_at', { ascending: false })

  // Get insurance via junction table
  const { data: insurance } = await supabase
    .from('object_insurance')
    .select(`
      *,
      policy:insurance_policies (
        *,
        insurer:contacts!insurer_contact_id (*)
      )
    `)
    .eq('object_id', id)

  // Get valuations via junction table
  const { data: valuations } = await supabase
    .from('object_valuations')
    .select(`
      *,
      valuation:valuations (
        *,
        appraiser:contacts!appraiser_contact_id (*)
      )
    `)
    .eq('object_id', id)
    .order('created_at', { ascending: false })

  // Get documents via polymorphic junction
  const { data: documents } = await supabase
    .from('entity_documents')
    .select(`
      *,
      document:documents (*)
    `)
    .eq('entity_type', 'object')
    .eq('entity_id', id)

  // Get expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      vendor:contacts!vendor_contact_id (*)
    `)
    .eq('object_id', id)

  return {
    ...object,
    acquisitions,
    loans,
    insurance,
    valuations,
    documents,
    expenses
  }
}
```

#### 1.2 Create Tabbed Object Detail Page
Update `app/dashboard/objects/[id]/page.tsx`:

```
- Overview Tab: Core info, current status summary cards
- Documents Tab: All linked documents with upload
- History Tab: Timeline of all events
- Financials Tab: Valuations, expenses, insurance
```

#### 1.3 Create Summary Cards Component
Small cards showing key related info:
- Acquisition card (when/where acquired, price)
- Current loan card (if on loan)
- Insurance card (current policy)
- Latest valuation card

---

### Phase 2: Linking Interface - Add Objects to Entities
**Goal:** Allow users to link/unlink objects when creating or editing entities

#### 2.1 Object Picker Component
Create a reusable component for selecting objects:

```typescript
// components/object-picker.tsx
// - Searchable list of objects
// - Shows thumbnail, title, artist
// - Checkbox selection for multi-select
// - Shows currently selected objects
// - Used in: Acquisition form, Loan form, Insurance form, Valuation form
```

#### 2.2 Update Entity Forms
Modify forms to include object selection:

**Acquisition Form:**
```
┌─────────────────────────────────────────────┐
│ Create Acquisition                           │
├─────────────────────────────────────────────┤
│ Seller: [Contact Picker]                     │
│ Date: [Date Picker]                          │
│ Total Amount: [Input]                        │
│                                              │
│ Objects in this Acquisition:                 │
│ ┌─────────────────────────────────────────┐ │
│ │ 🖼 Guernica - Picasso        [$2.1M]  ✕ │ │
│ │ 🖼 Starry Night - Van Gogh   [$1.5M]  ✕ │ │
│ │ [+ Add Object]                          │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [Cancel] [Save Acquisition]                  │
└─────────────────────────────────────────────┘
```

**Loan Form:**
```
┌─────────────────────────────────────────────┐
│ Create Loan                                  │
├─────────────────────────────────────────────┤
│ Direction: [Out ▼] (We're lending)           │
│ Borrower: [Contact Picker]                   │
│ Start Date: [___] End Date: [___]            │
│                                              │
│ Objects in this Loan:                        │
│ ┌─────────────────────────────────────────┐ │
│ │ 🖼 Guernica              Value: [$5M]   │ │
│ │    Condition Out: [Excellent ▼]         │ │
│ │ [+ Add Object]                          │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [Cancel] [Create Loan]                       │
└─────────────────────────────────────────────┘
```

#### 2.3 Batch Operations from Object List
Allow selecting multiple objects and performing batch actions:

```
┌─────────────────────────────────────────────────────────┐
│ Inventory                          [2 selected] ▼       │
│                                    - Create Acquisition │
│                                    - Create Loan        │
│                                    - Add to Insurance   │
│                                    - Move to Location   │
├─────────────────────────────────────────────────────────┤
│ ☑ │ 🖼 │ Guernica        │ Picasso     │ Available    │
│ ☑ │ 🖼 │ Starry Night    │ Van Gogh    │ Available    │
│ ☐ │ 🖼 │ The Scream      │ Munch       │ On Loan      │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 3: Entity Detail Pages - Show Related Objects
**Goal:** Each entity page shows its linked objects

#### 3.1 Acquisition Detail Page
```
┌─────────────────────────────────────────────┐
│ Acquisition: Sotheby's May 2019             │
│ Seller: Sotheby's New York                  │
│ Date: May 15, 2019                          │
│ Total: $3,600,000                           │
├─────────────────────────────────────────────┤
│ Objects (2):                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 🖼 Guernica - Picasso           $2.1M   │ │
│ │ 🖼 Starry Night - Van Gogh      $1.5M   │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Documents:                                   │
│ 📄 Invoice.pdf                               │
│ 📄 Bill of Sale.pdf                          │
└─────────────────────────────────────────────┘
```

#### 3.2 Loan Detail Page
```
┌─────────────────────────────────────────────┐
│ Loan: Metropolitan Museum Exhibition         │
│ Direction: Out (We lent)                     │
│ Borrower: Metropolitan Museum of Art         │
│ Period: Jan 2024 - Dec 2024                  │
│ Status: Active                               │
├─────────────────────────────────────────────┤
│ Objects on Loan (3):                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 🖼 Guernica         $5M    Excellent    │ │
│ │ 🖼 Starry Night     $4M    Good         │ │
│ │ 🖼 The Scream       $3M    Excellent    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Insurance: AXA Policy #12345                 │
│                                              │
│ Documents:                                   │
│ 📄 Loan Agreement.pdf                        │
│ 📄 Condition Report - Outgoing.pdf           │
└─────────────────────────────────────────────┘
```

#### 3.3 Artist Detail Page
```
┌─────────────────────────────────────────────┐
│ Artist: Pablo Picasso                        │
│ 1881 - 1973 | Spanish                        │
│ Bio: ...                                     │
├─────────────────────────────────────────────┤
│ Works in Collection (5):                     │
│ ┌─────────────────────────────────────────┐ │
│ │ 🖼 Guernica (1937)            On Loan   │ │
│ │ 🖼 Les Demoiselles (1907)     Available │ │
│ │ 🖼 Girl with Mandolin (1910)  Available │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [View All 5 Works]                           │
└─────────────────────────────────────────────┘
```

#### 3.4 Location Detail Page
```
┌─────────────────────────────────────────────┐
│ Location: Main Gallery - East Wing           │
│ Type: Gallery                                │
│ Parent: Main Building                        │
├─────────────────────────────────────────────┤
│ Objects at this Location (12):               │
│ ┌─────────────────────────────────────────┐ │
│ │ 🖼 Les Demoiselles - Picasso   Available │ │
│ │ 🖼 Water Lilies - Monet        Available │ │
│ │ ...                                      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Sub-locations:                               │
│ 📍 North Wall (3 objects)                    │
│ 📍 South Wall (5 objects)                    │
└─────────────────────────────────────────────┘
```

#### 3.5 Contact Detail Page
```
┌─────────────────────────────────────────────┐
│ Contact: Sotheby's New York                  │
│ Type: Auction House                          │
│ Email: contact@sothebys.com                  │
├─────────────────────────────────────────────┤
│ Related Activity:                            │
│                                              │
│ Acquisitions (2):                            │
│ • May 2019 - 2 objects ($3.6M)               │
│ • Oct 2020 - 1 object ($800K)                │
│                                              │
│ Loans (1):                                   │
│ • Impressionist Exhibition (lending to us)   │
│                                              │
│ Valuations (3):                              │
│ • Appraised 3 works in 2023                  │
└─────────────────────────────────────────────┘
```

---

### Phase 4: Quick Actions & Contextual Creation
**Goal:** Allow creating related records from context

#### 4.1 Quick Add Buttons on Object Page
```typescript
// On object detail page, add buttons:
<QuickActions objectId={object.id}>
  <QuickAction
    icon={<Receipt />}
    label="Add Expense"
    href={`/dashboard/expenses/new?object=${object.id}`}
  />
  <QuickAction
    icon={<FileText />}
    label="Add Document"
    onClick={() => setShowDocumentUpload(true)}
  />
  <QuickAction
    icon={<DollarSign />}
    label="Add Valuation"
    href={`/dashboard/valuations/new?object=${object.id}`}
  />
  <QuickAction
    icon={<ArrowLeftRight />}
    label="Create Loan"
    href={`/dashboard/loans/new?object=${object.id}`}
  />
</QuickActions>
```

#### 4.2 Pre-filled Forms
When navigating to create forms with object ID:
- Auto-add the object to the form
- Pre-fill relevant fields

```
/dashboard/loans/new?object=uuid-123
→ Loan form with object already added

/dashboard/valuations/new?object=uuid-123
→ Valuation form with object pre-selected

/dashboard/expenses/new?object=uuid-123
→ Expense form with object linked
```

#### 4.3 Inline Document Upload
On object page, allow uploading documents without leaving:
```typescript
<DocumentUploadModal
  entityType="object"
  entityId={object.id}
  onUpload={handleDocumentAdded}
/>
```

---

### Phase 5: Navigation & Discovery
**Goal:** Easy navigation between related entities

#### 5.1 Breadcrumb Navigation
```
Home > Inventory > Guernica > Loan: Met Exhibition
```

#### 5.2 Related Items Sidebar
On entity detail pages, show related items in sidebar:
```
┌─────────────────┐
│ Related Items   │
├─────────────────┤
│ Artist          │
│ → Pablo Picasso │
│                 │
│ Acquisition     │
│ → Sotheby's '19 │
│                 │
│ Current Loan    │
│ → Met Museum    │
│                 │
│ Insurance       │
│ → AXA Policy    │
└─────────────────┘
```

#### 5.3 Global Search
Search across all entities:
```
┌─────────────────────────────────────────────┐
│ 🔍 Search: "picasso"                         │
├─────────────────────────────────────────────┤
│ OBJECTS                                      │
│ 🖼 Guernica - Pablo Picasso                  │
│ 🖼 Les Demoiselles - Pablo Picasso           │
│                                              │
│ ARTISTS                                      │
│ 👤 Pablo Picasso (5 works)                   │
│                                              │
│ DOCUMENTS                                    │
│ 📄 Picasso Authentication Certificate        │
└─────────────────────────────────────────────┘
```

---

### Phase 6: Timeline & History View
**Goal:** Show chronological history of an artwork

#### 6.1 Object Timeline Component
```
┌─────────────────────────────────────────────┐
│ TIMELINE: Guernica                           │
├─────────────────────────────────────────────┤
│                                              │
│ 2024 ────────────────────────────────────   │
│   │                                          │
│   ├─ Jan 15: Loaned to Metropolitan Museum   │
│   │          📄 Condition Report attached    │
│   │                                          │
│   ├─ Jan 10: Valuation by Christie's         │
│   │          Appraised at $5.2M              │
│   │                                          │
│ 2023 ────────────────────────────────────   │
│   │                                          │
│   ├─ Dec 1: Insurance renewed                │
│   │         AXA Policy - $5M coverage        │
│   │                                          │
│   ├─ Mar 15: Moved to Storage B              │
│   │                                          │
│ 2019 ────────────────────────────────────   │
│   │                                          │
│   ├─ May 15: Acquired from Sotheby's         │
│   │          Purchase price: $2.1M           │
│   │          📄 Invoice attached             │
│   │                                          │
└─────────────────────────────────────────────┘
```

---

## Database Changes Required

### New Tables Needed

#### 1. Location History
Track object movements:
```sql
CREATE TABLE location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid REFERENCES objects(id) ON DELETE CASCADE,
  from_location_id uuid REFERENCES locations(id),
  to_location_id uuid REFERENCES locations(id),
  moved_at timestamp with time zone DEFAULT now(),
  notes text,
  user_id uuid REFERENCES auth.users NOT NULL
);
```

### Schema Modifications

None required - the junction tables already exist!

---

## Component Library to Build

1. **ObjectPicker** - Multi-select object chooser
2. **ContactPicker** - Contact selector with type filter
3. **RelatedObjectsList** - Display objects for an entity
4. **QuickActions** - Contextual action buttons
5. **Timeline** - Chronological event display
6. **SummaryCard** - Small info cards for related entities
7. **EntityBadge** - Status/type indicators
8. **DocumentUploadModal** - Inline document upload
9. **BatchActionMenu** - Actions for selected items
10. **GlobalSearch** - Cross-entity search

---

## Implementation Order

### Sprint 1: Foundation (Object Detail Enhancement)
1. [ ] Update `getObjectWithRelations` to fetch all related data
2. [ ] Create tabbed layout for object detail page
3. [ ] Build SummaryCard component
4. [ ] Display related acquisitions, loans, insurance on Overview tab
5. [ ] Display documents on Documents tab

### Sprint 2: Linking Interface
1. [ ] Build ObjectPicker component
2. [ ] Update Acquisition form with object picker
3. [ ] Update Loan form with object picker
4. [ ] Update Insurance form with object picker
5. [ ] Update Valuation form with object picker
6. [ ] Create junction table insert/update actions

### Sprint 3: Entity Detail Pages
1. [ ] Acquisition detail page with objects list
2. [ ] Loan detail page with objects list
3. [ ] Insurance detail page with objects list
4. [ ] Artist detail page with works list
5. [ ] Location detail page with objects list
6. [ ] Contact detail page with activity summary

### Sprint 4: Quick Actions & Context
1. [ ] Quick action buttons on object page
2. [ ] Pre-fill forms from URL params
3. [ ] Inline document upload modal
4. [ ] Contextual "Add to..." menus

### Sprint 5: Navigation & Discovery
1. [ ] Global search implementation
2. [ ] Related items sidebar
3. [ ] Breadcrumb navigation
4. [ ] Batch operations from inventory

### Sprint 6: History & Timeline
1. [ ] Location history table and tracking
2. [ ] Timeline component
3. [ ] History tab on object page
4. [ ] Activity feeds on entity pages

---

## Success Metrics

- User can see all related info on object detail page
- User can link objects when creating acquisitions/loans/etc.
- User can navigate between related entities in 1 click
- User can upload documents without leaving current page
- User can see complete history/timeline of any artwork
- Batch operations save time for multi-object tasks
