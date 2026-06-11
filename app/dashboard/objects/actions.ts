'use server'

import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { r2 } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export type ArtObject = {
    id: string
    title: string
    artist_id?: string
    category_id?: string
    location_id?: string
    permanent_location_id?: string
    status?: string
    year_created?: number
    date_text?: string
    description?: string
    inventory_number?: string
    previous_id?: string
    credit_line?: string
    alternate_title?: string
    country_of_origin?: string
    suite_portfolio?: string
    catalogue_raisonne?: string
    object_type?: string
    medium?: string
    edition?: string
    edition_number?: string
    edition_size?: number
    edition_type?: string
    signature_info?: string
    inscription?: string
    condition_description?: string
    condition_summary?: string
    frame_condition?: string
    provenance?: string
    is_framed?: boolean
    custom_fields?: Record<string, unknown>
    created_at?: string
    updated_at?: string
    // Joined data
    artists?: { id?: string; first_name?: string; last_name?: string; company?: string }
    categories?: { id?: string; name?: string }
    locations?: { id?: string; name?: string }
    permanent_location?: { id?: string; name?: string }
    object_media?: Array<{
        id: string
        r2_key_original?: string
        r2_key_medium?: string
        r2_key_thumbnail?: string
        is_primary?: boolean
        name?: string
        description?: string
        signed_url?: string
    }>
    object_dimensions?: Array<{
        id: string
        type?: string
        height?: number
        width?: number
        depth?: number
        unit?: string
    }>
}

type MediaItemInput = {
    keys: { original: string; medium?: string; thumbnail?: string }
    name?: string
    description?: string
    is_primary?: boolean
}

// The form sends dimension values as strings ('' when blank); coerce before insert.
type DimensionInput = {
    type?: string
    height?: number | string
    width?: number | string
    depth?: number | string
    unit?: string
}

function toNumericOrNull(value: number | string | undefined): number | null {
    if (value === undefined || value === null || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

type SignableMedia = { r2_key_medium: string | null; signed_url?: string }

async function signMediaUrls(media: SignableMedia[] | null | undefined) {
    if (!media || media.length === 0) return
    for (const item of media) {
        if (item.r2_key_medium) {
            try {
                const command = new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: item.r2_key_medium,
                })
                item.signed_url = await getSignedUrl(r2, command, { expiresIn: 3600 })
            } catch (err) {
                console.error('Error generating signed URL:', err)
            }
        }
    }
}

export async function getObject(id: string): Promise<ArtObject | null> {
    const { supabase } = await getWorkspaceContext()
    const { data, error } = await supabase
        .from('objects')
        .select(`
            *,
            artists (first_name, last_name, company),
            categories (name),
            locations:locations!objects_location_id_fkey (name),
            object_media (*),
            object_dimensions (*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching object:', error)
        return null
    }
    if (!data) return null

    await signMediaUrls(data.object_media)

    return data as ArtObject
}

// Extended type for object with all relations
export type ObjectWithRelations = ArtObject & {
    acquisitions?: Array<{
        object_price?: number
        discount?: number
        buyer_premium?: number
        taxes?: number
        lot_number?: string
        acquisition: {
            id: string
            acquisition_subject?: string
            acquisition_date?: string
            total_cost?: number
            currency?: string
            exchange_rate?: number
            notes?: string
            acquired_from?: { id: string; first_name?: string; last_name?: string; display_name?: string }
        }
    }>
    loans?: Array<{
        loan_value?: number
        condition_out?: string
        condition_in?: string
        loan: {
            id: string
            direction: string
            status: string
            start_date?: string
            end_date?: string
            notes?: string
            borrower?: { id: string; first_name?: string; last_name?: string; display_name?: string }
            lender?: { id: string; first_name?: string; last_name?: string; display_name?: string }
        }
    }>
    insurance?: Array<{
        insured_value?: number
        policy: {
            id: string
            policy_number?: string
            policy_subject?: string
            coverage_type?: string
            start_date?: string
            end_date?: string
            premium?: number
            insurer?: { id: string; first_name?: string; last_name?: string; display_name?: string }
        }
    }>
    valuations?: Array<{
        id: string
        appraised_value?: number
        low_estimate?: number
        high_estimate?: number
        notes?: string
        valuation: {
            id: string
            valuation_date?: string
            value_type?: string
            currency?: string
            appraiser?: { id: string; first_name?: string; last_name?: string; display_name?: string }
        }
    }>
    documents?: Array<{
        id: string
        document: {
            id: string
            document_name: string
            document_type?: string
            r2_key?: string
            file_size?: number
            created_at?: string
        }
    }>
    expenses?: Array<{
        id: string
        expense_type?: string
        amount?: number
        currency?: string
        expense_date?: string
        description?: string
        vendor?: { id: string; first_name?: string; last_name?: string; display_name?: string }
    }>
    lists?: Array<{
        sort_order?: number
        group: { id: string; name: string; description?: string }
    }>
}

export async function getObjectWithRelations(id: string): Promise<ObjectWithRelations | null> {
    const { supabase } = await getWorkspaceContext()

    // Get base object with core relations
    const { data: object, error } = await supabase
        .from('objects')
        .select(`
            *,
            artists (id, first_name, last_name, company),
            categories (id, name),
            locations:locations!objects_location_id_fkey (id, name, type),
            permanent_location:locations!objects_permanent_location_id_fkey (id, name, type),
            object_media (*),
            object_dimensions (*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching object:', error)
        return null
    }
    if (!object) return null

    await signMediaUrls(object.object_media)

    // Fetch related data in parallel
    const [acquisitionsRes, loansRes, insuranceRes, valuationsRes, documentsRes, expensesRes, listsRes] = await Promise.all([
        // Acquisitions via junction table
        supabase
            .from('object_acquisitions')
            .select(`
                object_price,
                discount,
                buyer_premium,
                taxes,
                lot_number,
                acquisition:acquisitions (
                    id,
                    acquisition_subject,
                    acquisition_date,
                    total_cost,
                    currency,
                    exchange_rate,
                    notes,
                    acquired_from:contacts!acquisitions_acquired_from_contact_id_fkey (id, first_name, last_name, display_name)
                )
            `)
            .eq('object_id', id),

        // Loans via junction table
        supabase
            .from('object_loans')
            .select(`
                loan_value,
                condition_out,
                condition_in,
                loan:loans (
                    id,
                    direction,
                    status,
                    start_date,
                    end_date,
                    notes,
                    borrower:contacts!loans_borrower_contact_id_fkey (id, first_name, last_name, display_name),
                    lender:contacts!loans_lender_contact_id_fkey (id, first_name, last_name, display_name)
                )
            `)
            .eq('object_id', id),

        // Insurance via junction table
        supabase
            .from('object_insurance')
            .select(`
                insured_value,
                policy:insurance_policies (
                    id,
                    policy_number,
                    policy_subject,
                    coverage_type,
                    start_date,
                    end_date,
                    premium,
                    insurer:contacts!insurance_policies_insurer_contact_id_fkey (id, first_name, last_name, display_name)
                )
            `)
            .eq('object_id', id),

        // Valuations via junction table
        supabase
            .from('object_valuations')
            .select(`
                id,
                appraised_value,
                low_estimate,
                high_estimate,
                notes,
                valuation:valuations (
                    id,
                    valuation_date,
                    value_type,
                    currency,
                    appraiser:contacts!valuations_appraiser_contact_id_fkey (id, first_name, last_name, display_name)
                )
            `)
            .eq('object_id', id)
            .order('created_at', { ascending: false }),

        // Documents via polymorphic junction
        supabase
            .from('entity_documents')
            .select(`
                id,
                document:documents (
                    id,
                    document_name,
                    document_type,
                    r2_key,
                    file_size,
                    created_at
                )
            `)
            .eq('entity_type', 'object')
            .eq('entity_id', id),

        // Expenses (direct relation)
        supabase
            .from('expenses')
            .select(`
                id,
                expense_type,
                amount,
                currency,
                expense_date,
                description,
                vendor:contacts!expenses_vendor_contact_id_fkey (id, first_name, last_name, display_name)
            `)
            .eq('object_id', id)
            .order('expense_date', { ascending: false }),

        // Lists (groups) via junction table
        supabase
            .from('object_groups')
            .select(`
                sort_order,
                group:groups (id, name, description)
            `)
            .eq('object_id', id)
    ])

    return {
        ...object,
        acquisitions: acquisitionsRes.data || [],
        loans: loansRes.data || [],
        insurance: insuranceRes.data || [],
        valuations: valuationsRes.data || [],
        documents: documentsRes.data || [],
        expenses: expensesRes.data || [],
        lists: listsRes.data || []
    } as unknown as ObjectWithRelations
}

export async function updateObject(id: string, formData: FormData) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // Extract core object data
    const title = formData.get('title') as string
    const artist_id = formData.get('artist_id') as string
    const category_id = formData.get('category_id') as string
    const location_id = formData.get('location_id') as string
    const status = formData.get('status') as string
    const year_created = formData.get('year_created') ? parseInt(formData.get('year_created') as string) : null
    const description = formData.get('description') as string

    const inventory_number = formData.get('inventory_number') as string
    const object_type = formData.get('object_type') as string
    const medium = formData.get('medium') as string
    const edition = formData.get('edition') as string
    const signature_info = formData.get('signature_info') as string
    const condition_description = formData.get('condition_description') as string
    const provenance = formData.get('provenance') as string
    const is_framed = formData.get('is_framed') === 'true'

    const { error } = await supabase
        .from('objects')
        .update({
            title,
            artist_id: artist_id || null,
            category_id: category_id || null,
            location_id: location_id || null,
            status,
            year_created,
            description,
            inventory_number: inventory_number || null,
            object_type: object_type || null,
            medium: medium || null,
            edition: edition || null,
            signature_info: signature_info || null,
            condition_description: condition_description || null,
            provenance: provenance || null,
            is_framed,
        })
        .eq('id', id)

    if (error) throw new Error(`Failed to update object: ${error.message}`)

    // Handle new media uploads
    const newMediaItems: MediaItemInput[] = JSON.parse(formData.get('new_media') as string || '[]')
    if (newMediaItems.length > 0) {
        const { error: mediaError } = await supabase.from('object_media').insert(
            newMediaItems.map((m) => ({
                workspace_id: workspaceId,
                object_id: id,
                type: 'image',
                r2_key_original: m.keys.original,
                r2_key_medium: m.keys.medium,
                r2_key_thumbnail: m.keys.thumbnail,
                name: m.name,
                description: m.description,
                is_primary: m.is_primary || false,
            }))
        )
        if (mediaError) console.error('Failed to insert new media:', mediaError)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/objects/${id}`)
    redirect(`/dashboard/objects/${id}`)
}

export async function deleteObject(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    // Delete associated media records (cascade should handle this)
    await supabase.from('object_media').delete().eq('object_id', id)
    await supabase.from('object_dimensions').delete().eq('object_id', id)

    const { error } = await supabase
        .from('objects')
        .delete()
        .eq('id', id)

    if (error) throw new Error(`Failed to delete object: ${error.message}`)

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function getCategories() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name')
    return data || []
}

export async function getLocations() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name')
    return data || []
}

export async function createObject(formData: FormData) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // Extract core object data
    const title = formData.get('title') as string
    const artist_id = formData.get('artist_id') as string
    const category_id = formData.get('category_id') as string
    const location_id = formData.get('location_id') as string
    const status = formData.get('status') as string
    const year_created = formData.get('year_created') ? parseInt(formData.get('year_created') as string) : null
    const description = formData.get('description') as string

    const object_type = formData.get('object_type') as string
    const medium = formData.get('medium') as string
    const edition = formData.get('edition') as string
    const signature_info = formData.get('signature_info') as string
    const condition_description = formData.get('condition_description') as string
    const provenance = formData.get('provenance') as string
    const is_framed = formData.get('is_framed') === 'true'

    // New cataloguing fields
    const permanent_location_id = formData.get('permanent_location_id') as string
    const date_text = formData.get('date_text') as string
    const credit_line = formData.get('credit_line') as string
    const alternate_title = formData.get('alternate_title') as string
    const country_of_origin = formData.get('country_of_origin') as string
    const suite_portfolio = formData.get('suite_portfolio') as string
    const catalogue_raisonne = formData.get('catalogue_raisonne') as string
    const previous_id = formData.get('previous_id') as string
    const edition_number = formData.get('edition_number') as string
    const edition_size = formData.get('edition_size') ? parseInt(formData.get('edition_size') as string) : null
    const edition_type = formData.get('edition_type') as string

    // Accession auto-numbering: applies when the field is left blank and the
    // workspace has a prefix configured.
    let inventory_number = (formData.get('inventory_number') as string) || null
    if (!inventory_number) {
        const { data: ws } = await supabase
            .from('workspaces')
            .select('accession_prefix')
            .eq('id', workspaceId)
            .single()
        if (ws?.accession_prefix) {
            const year = new Date().getFullYear()
            const { count } = await supabase
                .from('objects')
                .select('id', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId)
                .like('inventory_number', `${ws.accession_prefix}-${year}-%`)
            inventory_number = `${ws.accession_prefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`
        }
    }

    // Extract JSON data
    const custom_fields = JSON.parse(formData.get('custom_fields') as string || '{}')
    const dimensions: DimensionInput[] = JSON.parse(formData.get('dimensions') as string || '[]')
    const mediaItems: MediaItemInput[] = JSON.parse(formData.get('media') as string || '[]')

    // 1. Create Object
    const { data: object, error: objError } = await supabase
        .from('objects')
        .insert({
            workspace_id: workspaceId,
            title,
            artist_id: artist_id || null,
            category_id: category_id || null,
            location_id: location_id || null,
            status,
            year_created,
            description,
            custom_fields,
            inventory_number,
            object_type: object_type || null,
            medium: medium || null,
            edition: edition || null,
            signature_info: signature_info || null,
            condition_description: condition_description || null,
            provenance: provenance || null,
            is_framed,
            permanent_location_id: permanent_location_id || null,
            date_text: date_text || null,
            credit_line: credit_line || null,
            alternate_title: alternate_title || null,
            country_of_origin: country_of_origin || null,
            suite_portfolio: suite_portfolio || null,
            catalogue_raisonne: catalogue_raisonne || null,
            previous_id: previous_id || null,
            edition_number: edition_number || null,
            edition_size: Number.isFinite(edition_size) ? edition_size : null,
            edition_type: edition_type || null,
        })
        .select()
        .single()

    if (objError) throw new Error(`Failed to create object: ${objError.message}`)

    // 2. Insert Dimensions
    if (dimensions.length > 0) {
        const { error: dimError } = await supabase.from('object_dimensions').insert(
            dimensions
                .filter((d) => toNumericOrNull(d.height) !== null || toNumericOrNull(d.width) !== null || toNumericOrNull(d.depth) !== null)
                .map((d) => ({
                    workspace_id: workspaceId,
                    object_id: object.id,
                    type: d.type,
                    height: toNumericOrNull(d.height),
                    width: toNumericOrNull(d.width),
                    depth: toNumericOrNull(d.depth),
                    unit: d.unit,
                }))
        )
        if (dimError) console.error('Failed to insert dimensions:', dimError)
    }

    // 3. Insert Media
    if (mediaItems.length > 0) {
        const { error: mediaError } = await supabase.from('object_media').insert(
            mediaItems.map((m) => ({
                workspace_id: workspaceId,
                object_id: object.id,
                type: 'image',
                r2_key_original: m.keys.original,
                r2_key_medium: m.keys.medium,
                r2_key_thumbnail: m.keys.thumbnail,
                name: m.name,
                description: m.description,
                is_primary: m.is_primary || false,
            }))
        )
        if (mediaError) console.error('Failed to insert media:', mediaError)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export type ObjectForSelection = {
    id: string
    title: string
    inventory_number?: string
    artist_name?: string
    thumbnail_url?: string
}

export async function getObjectsForSelection(): Promise<ObjectForSelection[]> {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data, error } = await supabase
        .from('objects')
        .select(`
            id,
            title,
            inventory_number,
            artists (first_name, last_name)
        `)
        .eq('workspace_id', workspaceId)
        .order('title')

    if (error) {
        console.error('Error fetching objects for selection:', error)
        return []
    }

    return (data || []).map(obj => {
        const artist = obj.artists as { first_name?: string; last_name?: string } | null
        return {
            id: obj.id,
            title: obj.title,
            inventory_number: obj.inventory_number ?? undefined,
            artist_name: artist
                ? `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
                : undefined
        }
    })
}

// ---------------------------------------------------------------------------
// Per-field inline editing
// ---------------------------------------------------------------------------

// Columns the inline editor is allowed to patch.
const UPDATABLE_OBJECT_COLUMNS = new Set([
    'title', 'alternate_title', 'inventory_number', 'previous_id', 'credit_line',
    'artist_id', 'category_id', 'location_id', 'permanent_location_id', 'status',
    'year_created', 'date_text', 'medium', 'object_type', 'country_of_origin',
    'edition', 'edition_number', 'edition_size', 'edition_type',
    'suite_portfolio', 'catalogue_raisonne', 'signature_info', 'inscription',
    'is_framed', 'frame_condition', 'description', 'provenance',
    'condition_description', 'condition_summary',
])

export async function updateObjectFields(id: string, patch: Record<string, unknown>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const update: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(patch)) {
        if (!UPDATABLE_OBJECT_COLUMNS.has(key)) continue
        update[key] = value === '' ? null : value
    }
    if (Object.keys(update).length === 0) throw new Error('No editable fields in patch')

    const { error } = await supabase
        .from('objects')
        .update(update)
        .eq('id', id)

    if (error) throw new Error(`Failed to update object: ${error.message}`)

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/objects/${id}`)
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export async function addObjectDimension(objectId: string, dim: DimensionInput) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { error } = await supabase.from('object_dimensions').insert({
        workspace_id: workspaceId,
        object_id: objectId,
        type: dim.type || 'dimensions',
        height: toNumericOrNull(dim.height),
        width: toNumericOrNull(dim.width),
        depth: toNumericOrNull(dim.depth),
        unit: dim.unit || 'cm',
    })

    if (error) throw new Error(`Failed to add dimension: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
}

export async function updateObjectDimension(id: string, dim: DimensionInput) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('object_dimensions')
        .update({
            type: dim.type || 'dimensions',
            height: toNumericOrNull(dim.height),
            width: toNumericOrNull(dim.width),
            depth: toNumericOrNull(dim.depth),
            unit: dim.unit || 'cm',
        })
        .eq('id', id)

    if (error) throw new Error(`Failed to update dimension: ${error.message}`)
    revalidatePath('/dashboard/objects')
}

export async function deleteObjectDimension(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase.from('object_dimensions').delete().eq('id', id)
    if (error) throw new Error(`Failed to delete dimension: ${error.message}`)
    revalidatePath('/dashboard/objects')
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function addObjectMedia(objectId: string, items: MediaItemInput[]) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx
    if (items.length === 0) return

    const { error } = await supabase.from('object_media').insert(
        items.map((m) => ({
            workspace_id: workspaceId,
            object_id: objectId,
            type: 'image',
            r2_key_original: m.keys.original,
            r2_key_medium: m.keys.medium,
            r2_key_thumbnail: m.keys.thumbnail,
            name: m.name,
            description: m.description,
            is_primary: m.is_primary || false,
        }))
    )

    if (error) throw new Error(`Failed to add media: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
}

export async function updateObjectMedia(id: string, data: { name?: string; description?: string }) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('object_media')
        .update({ name: data.name || null, description: data.description || null })
        .eq('id', id)

    if (error) throw new Error(`Failed to update media: ${error.message}`)
    revalidatePath('/dashboard/objects')
}

export async function setObjectMediaPrimary(objectId: string, mediaId: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error: clearError } = await supabase
        .from('object_media')
        .update({ is_primary: false })
        .eq('object_id', objectId)
    if (clearError) throw new Error(`Failed to set primary image: ${clearError.message}`)

    const { error } = await supabase
        .from('object_media')
        .update({ is_primary: true })
        .eq('id', mediaId)
    if (error) throw new Error(`Failed to set primary image: ${error.message}`)

    revalidatePath(`/dashboard/objects/${objectId}`)
    revalidatePath('/dashboard')
}

export async function deleteObjectMedia(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase.from('object_media').delete().eq('id', id)
    if (error) throw new Error(`Failed to delete media: ${error.message}`)
    revalidatePath('/dashboard/objects')
}

// ---------------------------------------------------------------------------
// Loan links (no link actions exist in app/actions/loans.ts yet)
// ---------------------------------------------------------------------------

export async function linkObjectToLoan(objectId: string, loanId: string, loanValue?: number) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { error } = await supabase.from('object_loans').insert({
        workspace_id: workspaceId,
        object_id: objectId,
        loan_id: loanId,
        loan_value: loanValue ?? null,
    })

    if (error) throw new Error(`Failed to link loan: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
    revalidatePath('/dashboard/loans')
}

export async function updateObjectLoan(objectId: string, loanId: string, loanValue?: number) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('object_loans')
        .update({ loan_value: loanValue ?? null })
        .eq('object_id', objectId)
        .eq('loan_id', loanId)

    if (error) throw new Error(`Failed to update loan link: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
    revalidatePath('/dashboard/loans')
}

export async function unlinkObjectFromLoan(objectId: string, loanId: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('object_loans')
        .delete()
        .eq('object_id', objectId)
        .eq('loan_id', loanId)

    if (error) throw new Error(`Failed to unlink loan: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
    revalidatePath('/dashboard/loans')
}

// Insurance junction edit (link/unlink live in app/actions/insurance.ts)
export async function updateObjectInsurance(objectId: string, policyId: string, insuredValue?: number) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('object_insurance')
        .update({ insured_value: insuredValue ?? null })
        .eq('object_id', objectId)
        .eq('policy_id', policyId)

    if (error) throw new Error(`Failed to update insured value: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
    revalidatePath('/dashboard/insurance')
}

// ---------------------------------------------------------------------------
// Lists (groups)
// ---------------------------------------------------------------------------

export async function getListsForSelection() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('groups')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('name')
    return data || []
}

export async function createList(name: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { data, error } = await supabase
        .from('groups')
        .insert({ workspace_id: workspaceId, name })
        .select('id, name')
        .single()

    if (error) throw new Error(`Failed to create list: ${error.message}`)
    return data
}

export async function addObjectToList(objectId: string, groupId: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { error } = await supabase.from('object_groups').insert({
        workspace_id: workspaceId,
        object_id: objectId,
        group_id: groupId,
    })

    if (error && !error.message.includes('duplicate')) {
        throw new Error(`Failed to add to list: ${error.message}`)
    }
    revalidatePath(`/dashboard/objects/${objectId}`)
}

export async function removeObjectFromList(objectId: string, groupId: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('object_groups')
        .delete()
        .eq('object_id', objectId)
        .eq('group_id', groupId)

    if (error) throw new Error(`Failed to remove from list: ${error.message}`)
    revalidatePath(`/dashboard/objects/${objectId}`)
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export type ActivityEntry = {
    id: string
    action: string
    entity_type: string
    created_at: string
    user_email?: string | null
    changes: Record<string, unknown> | null
}

export async function getObjectActivity(objectId: string): Promise<ActivityEntry[]> {
    const { supabase, workspaceId } = await getWorkspaceContext()

    const [logRes, emailRes] = await Promise.all([
        supabase
            .from('activity_log')
            .select('id, action, entity_type, user_id, created_at, changes')
            .eq('workspace_id', workspaceId)
            .eq('entity_type', 'objects')
            .eq('entity_id', objectId)
            .order('created_at', { ascending: false }),
        supabase.rpc('workspace_member_emails', { ws_id: workspaceId }),
    ])

    const emailMap = new Map<string, string>(
        (emailRes.data || []).map((r: { user_id: string; email: string }) => [r.user_id, r.email])
    )

    return (logRes.data || []).map((row) => ({
        id: row.id,
        action: row.action,
        entity_type: row.entity_type,
        created_at: row.created_at,
        user_email: row.user_id ? emailMap.get(row.user_id) ?? null : null,
        changes: row.changes as Record<string, unknown> | null,
    }))
}

// ---------------------------------------------------------------------------
// Prev/next paging fallback: workspace object ids ordered by created_at desc
// ---------------------------------------------------------------------------

export async function getObjectNavIds(): Promise<string[]> {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('objects')
        .select('id')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
    return (data || []).map((r) => r.id)
}
