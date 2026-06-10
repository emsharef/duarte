// Object lifecycle statuses (must match the objects.status check constraint)
export const OBJECT_STATUSES = [
    'in_collection',
    'on_loan',
    'on_consignment',
    'sold',
    'traded',
    'gifted',
    'donated',
    'lost',
    'destroyed',
    'deaccessioned',
] as const

export const OBJECT_STATUS_LABELS: Record<string, string> = {
    in_collection: 'In collection',
    on_loan: 'On loan',
    on_consignment: 'On consignment',
    sold: 'Sold',
    traded: 'Traded',
    gifted: 'Gifted',
    donated: 'Donated',
    lost: 'Lost',
    destroyed: 'Destroyed',
    deaccessioned: 'Deaccessioned',
}

// Contact types
export const CONTACT_TYPES = [
    'Person',
    'Gallery',
    'Auction House',
    'Museum',
    'Appraiser',
    'Conservator',
    'Shipper',
    'Insurance Company',
    'Other',
] as const

// Acquisition types
export const ACQUISITION_TYPES = [
    'Purchase',
    'Gift',
    'Bequest',
    'Exchange',
    'Commission',
    'Found',
    'Other',
] as const

// Insurance coverage types
export const COVERAGE_TYPES = [
    'Blanket',
    'Scheduled',
    'All Risk',
    'Named Peril',
    'Transit Only',
    'Other',
] as const

// Valuation types
export const VALUE_TYPES = [
    'Insurance',
    'Fair Market Value',
    'Retail Replacement',
    'Auction Estimate',
    'Donation',
    'Estate',
    'Other',
] as const

// Valuation statuses
export const VALUATION_STATUSES = [
    'Pending',
    'In Progress',
    'Closed',
] as const

// Expense types
export const EXPENSE_TYPES = [
    'Framing',
    'Conservation',
    'Restoration',
    'Shipping',
    'Storage',
    'Insurance Premium',
    'Appraisal Fee',
    'Photography',
    'Installation',
    'Crating',
    'Other',
] as const

// Loan directions
export const LOAN_DIRECTIONS = [
    'out',
    'in',
] as const

// Loan statuses
export const LOAN_STATUSES = [
    'Pending',
    'Active',
    'Returned',
    'Overdue',
] as const

// Document types
export const DOCUMENT_TYPES = [
    'Invoice',
    'Certificate',
    'Appraisal',
    'Correspondence',
    'Photo',
    'Contract',
    'Report',
    'Condition Report',
    'Provenance',
    'Insurance',
    'Loan Agreement',
    'Other',
] as const

// Location types
export const LOCATION_TYPES = [
    'Building',
    'Room',
    'Wall',
    'Storage',
    'Vault',
    'Gallery',
    'Office',
    'Warehouse',
    'Other',
] as const

// Entity types for document linking
export const ENTITY_TYPES = [
    'object',
    'artist',
    'contact',
    'acquisition',
    'loan',
    'insurance',
    'valuation',
    'expense',
    'location',
] as const
