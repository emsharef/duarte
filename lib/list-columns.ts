import type { Tables } from '@/lib/database.types'
import { OBJECT_STATUSES, OBJECT_STATUS_LABELS } from '@/lib/constants'

export type ObjectsGridRow = Tables<'objects_grid'>

// Grid row enriched with a signed thumbnail URL (merged in on the server)
export type GridRow = ObjectsGridRow & { signed_url: string | null }

// Status buckets for the left rail
export const STATUS_BUCKETS = {
    current: ['in_collection', 'on_loan', 'on_consignment'],
    incoming: ['incoming'],
    former: ['sold', 'traded', 'gifted', 'donated', 'deaccessioned', 'lost', 'destroyed'],
} as const

export type StatusBucket = keyof typeof STATUS_BUCKETS

export const STATUS_BUCKET_LABELS: Record<StatusBucket, string> = {
    current: 'Current',
    incoming: 'Incoming',
    former: 'Former',
}

// Full status list for inline chips (includes 'incoming' added in Phase 2)
export const LIST_STATUSES: string[] = Array.from(new Set(['incoming', ...OBJECT_STATUSES]))

export const LIST_STATUS_LABELS: Record<string, string> = {
    incoming: 'Incoming',
    ...OBJECT_STATUS_LABELS,
}

export function statusChipClass(status: string): string {
    switch (status) {
        case 'in_collection':
            return 'bg-green-100 text-green-800'
        case 'on_loan':
        case 'on_consignment':
            return 'bg-blue-100 text-blue-800'
        case 'incoming':
            return 'bg-amber-100 text-amber-800'
        case 'lost':
        case 'destroyed':
            return 'bg-red-100 text-red-800'
        case 'sold':
        case 'traded':
        case 'gifted':
        case 'donated':
        case 'deaccessioned':
            return 'bg-gray-100 text-gray-800'
        default:
            return 'bg-yellow-100 text-yellow-800'
    }
}

export type ListColumnType = 'text' | 'money' | 'date' | 'image' | 'status'

export type ListColumnDef = {
    key: string
    label: string
    // objects_grid column the value comes from ('signed_url' for the merged thumbnail)
    source: keyof GridRow
    type: ListColumnType
    // For money columns denominated in the workspace default currency:
    // grid column to sum into the footer totals row
    domesticKey?: keyof ObjectsGridRow
    // For money columns in their original currency: grid column holding the currency code
    currencySource?: keyof ObjectsGridRow
}

export const LIST_COLUMNS: ListColumnDef[] = [
    { key: 'image', label: 'Image', source: 'signed_url', type: 'image' },
    { key: 'inventory_number', label: 'Inventory #', source: 'inventory_number', type: 'text' },
    { key: 'artist_name', label: 'Artist', source: 'artist_name', type: 'text' },
    { key: 'title', label: 'Title', source: 'title', type: 'text' },
    { key: 'date', label: 'Date', source: 'date_text', type: 'text' },
    { key: 'object_type', label: 'Type', source: 'object_type', type: 'text' },
    { key: 'category_name', label: 'Category', source: 'category_name', type: 'text' },
    { key: 'medium', label: 'Medium', source: 'medium', type: 'text' },
    { key: 'location_name', label: 'Location', source: 'location_name', type: 'text' },
    { key: 'permanent_location_name', label: 'Permanent location', source: 'permanent_location_name', type: 'text' },
    { key: 'status', label: 'Status', source: 'status', type: 'status' },
    { key: 'acquisition_price', label: 'Acq. price (orig.)', source: 'acquisition_price', type: 'money', currencySource: 'acquisition_currency' },
    { key: 'acquisition_price_domestic', label: 'Acq. price', source: 'acquisition_price_domestic', type: 'money', domesticKey: 'acquisition_price_domestic' },
    { key: 'current_value_domestic', label: 'Current value', source: 'current_value_domestic', type: 'money', domesticKey: 'current_value_domestic' },
    { key: 'insured_value_total', label: 'Insured value', source: 'insured_value_total', type: 'money', domesticKey: 'insured_value_total' },
    { key: 'created_at', label: 'Added', source: 'created_at', type: 'date' },
]

export function getListColumn(key: string): ListColumnDef | undefined {
    return LIST_COLUMNS.find((c) => c.key === key)
}

// Roughly the current table: image, title, artist, year/date, status, location
export const DEFAULT_VISIBLE_COLUMNS = ['image', 'title', 'artist_name', 'date', 'status', 'location_name']

export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Saved view config stored in saved_views.config
export type ViewSort = { id: string; desc: boolean } | null

export type SavedViewConfig = {
    columns: string[]
    sort: ViewSort
    pageSize: number
}

// Scoped search fields (must be text columns on objects_grid)
export const SEARCH_FIELDS = [
    { key: 'all', label: 'All fields' },
    { key: 'title', label: 'Title' },
    { key: 'artist_name', label: 'Artist' },
    { key: 'inventory_number', label: 'Inventory #' },
    { key: 'medium', label: 'Medium' },
    { key: 'description', label: 'Description' },
] as const

// Cell value for a column key, handling the date_text/year_created fallback
export function gridCellValue(row: GridRow, def: ListColumnDef): unknown {
    if (def.key === 'date') return row.date_text ?? row.year_created ?? null
    return row[def.source]
}

export function formatMoney(value: number | null | undefined, currency: string): string {
    if (value == null) return ''
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(value)
    } catch {
        return `${currency} ${value.toLocaleString()}`
    }
}
