'use server'

import { createClient } from '@/lib/supabase/server'
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
    status?: string
    year_created?: number
    description?: string
    inventory_number?: string
    object_type?: string
    medium?: string
    edition?: string
    signature_info?: string
    condition_description?: string
    provenance?: string
    exhibition_history?: string
    is_framed?: boolean
    custom_fields?: Record<string, any>
    created_at?: string
    updated_at?: string
    // Joined data
    artists?: { first_name?: string; last_name?: string; company?: string }
    categories?: { name?: string }
    locations?: { name?: string }
    object_media?: Array<{
        id: string
        r2_key_original?: string
        r2_key_medium?: string
        r2_key_thumbnail?: string
        is_primary?: boolean
        name?: string
        description?: string
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

export async function getObject(id: string): Promise<ArtObject | null> {
    const supabase = await createClient()
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

    // Generate signed URLs for media
    if (data.object_media && data.object_media.length > 0) {
        for (const media of data.object_media) {
            if (media.r2_key_medium) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: media.r2_key_medium,
                    })
                    media.signed_url = await getSignedUrl(r2, command, { expiresIn: 3600 })
                } catch (err) {
                    console.error('Error generating signed URL:', err)
                }
            }
        }
    }

    return data
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
        id: string
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
        id: string
        insured_value?: number
        policy: {
            id: string
            policy_number?: string
            provider?: string
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
            purpose?: string
            currency?: string
            appraiser?: { id: string; first_name?: string; last_name?: string; display_name?: string }
        }
    }>
    documents?: Array<{
        id: string
        document: {
            id: string
            name: string
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
}

export async function getObjectWithRelations(id: string): Promise<ObjectWithRelations | null> {
    const supabase = await createClient()

    // Get base object with core relations
    const { data: object, error } = await supabase
        .from('objects')
        .select(`
            *,
            artists (id, first_name, last_name, company),
            categories (id, name),
            locations:locations!objects_location_id_fkey (id, name, type),
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

    // Generate signed URLs for media
    if (object.object_media && object.object_media.length > 0) {
        for (const media of object.object_media) {
            if (media.r2_key_medium) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: media.r2_key_medium,
                    })
                    media.signed_url = await getSignedUrl(r2, command, { expiresIn: 3600 })
                } catch (err) {
                    console.error('Error generating signed URL:', err)
                }
            }
        }
    }

    // Fetch related data in parallel
    const [acquisitionsRes, loansRes, insuranceRes, valuationsRes, documentsRes, expensesRes] = await Promise.all([
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
                id,
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
            .eq('object_id', id)
            .order('created_at', { ascending: false }),

        // Insurance via junction table
        supabase
            .from('object_insurance')
            .select(`
                id,
                insured_value,
                policy:insurance_policies (
                    id,
                    policy_number,
                    provider,
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
                    purpose,
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
                    name,
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
            .order('expense_date', { ascending: false })
    ])

    return {
        ...object,
        acquisitions: acquisitionsRes.data || [],
        loans: loansRes.data || [],
        insurance: insuranceRes.data || [],
        valuations: valuationsRes.data || [],
        documents: documentsRes.data || [],
        expenses: expensesRes.data || []
    }
}

export async function updateObject(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Extract core object data
    const title = formData.get('title') as string
    const artist_id = formData.get('artist_id') as string
    const category_id = formData.get('category_id') as string
    const location_id = formData.get('location_id') as string
    const status = formData.get('status') as string
    const year_created = formData.get('year_created') ? parseInt(formData.get('year_created') as string) : null
    const description = formData.get('description') as string

    // New fields
    const inventory_number = formData.get('inventory_number') as string
    const object_type = formData.get('object_type') as string
    const medium = formData.get('medium') as string
    const edition = formData.get('edition') as string
    const signature_info = formData.get('signature_info') as string
    const condition_description = formData.get('condition_description') as string
    const provenance = formData.get('provenance') as string
    const exhibition_history = formData.get('exhibition_history') as string
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
            exhibition_history: exhibition_history || null,
            is_framed,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) throw new Error(`Failed to update object: ${error.message}`)

    // Handle new media uploads
    const newMediaItems = JSON.parse(formData.get('new_media') as string || '[]')
    if (newMediaItems.length > 0) {
        const { error: mediaError } = await supabase.from('object_media').insert(
            newMediaItems.map((m: any) => ({
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

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
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return data || []
}

export async function getLocations() {
    const supabase = await createClient()
    const { data } = await supabase.from('locations').select('*').order('name')
    return data || []
}

export async function createObject(formData: FormData) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Extract core object data
    const title = formData.get('title') as string
    const artist_id = formData.get('artist_id') as string
    const category_id = formData.get('category_id') as string
    const location_id = formData.get('location_id') as string
    const status = formData.get('status') as string
    const year_created = formData.get('year_created') ? parseInt(formData.get('year_created') as string) : null
    const description = formData.get('description') as string

    // New fields
    const inventory_number = formData.get('inventory_number') as string
    const object_type = formData.get('object_type') as string
    const medium = formData.get('medium') as string
    const edition = formData.get('edition') as string
    const signature_info = formData.get('signature_info') as string
    const condition_description = formData.get('condition_description') as string
    const provenance = formData.get('provenance') as string
    const exhibition_history = formData.get('exhibition_history') as string
    const is_framed = formData.get('is_framed') === 'true'

    // Extract JSON data
    const custom_fields = JSON.parse(formData.get('custom_fields') as string || '{}')
    const dimensions = JSON.parse(formData.get('dimensions') as string || '[]')
    const mediaItems = JSON.parse(formData.get('media') as string || '[]')

    // 1. Create Object
    const { data: object, error: objError } = await supabase
        .from('objects')
        .insert({
            user_id: user.id,
            title,
            artist_id: artist_id || null,
            category_id: category_id || null,
            location_id: location_id || null,
            status,
            year_created,
            description,
            custom_fields,
            inventory_number: inventory_number || null,
            object_type: object_type || null,
            medium: medium || null,
            edition: edition || null,
            signature_info: signature_info || null,
            condition_description: condition_description || null,
            provenance: provenance || null,
            exhibition_history: exhibition_history || null,
            is_framed,
        })
        .select()
        .single()

    if (objError) throw new Error(`Failed to create object: ${objError.message}`)

    // 2. Insert Dimensions
    if (dimensions.length > 0) {
        const { error: dimError } = await supabase.from('object_dimensions').insert(
            dimensions.map((d: any) => ({
                object_id: object.id,
                type: d.type,
                height: d.height,
                width: d.width,
                depth: d.depth,
                unit: d.unit,
            }))
        )
        if (dimError) console.error('Failed to insert dimensions:', dimError)
    }

    // 3. Insert Media
    if (mediaItems.length > 0) {
        const { error: mediaError } = await supabase.from('object_media').insert(
            mediaItems.map((m: any) => ({
                object_id: object.id,
                type: 'image', // Assuming image for now
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
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('objects')
        .select(`
            id,
            title,
            inventory_number,
            artists (first_name, last_name)
        `)
        .order('title')

    if (error) {
        console.error('Error fetching objects for selection:', error)
        return []
    }

    return (data || []).map(obj => ({
        id: obj.id,
        title: obj.title,
        inventory_number: obj.inventory_number,
        artist_name: obj.artists
            ? `${obj.artists.first_name || ''} ${obj.artists.last_name || ''}`.trim()
            : undefined
    }))
}
