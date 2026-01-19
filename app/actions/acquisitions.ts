'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Acquisition = {
    id: string
    acquisition_subject?: string
    acquisition_date?: string
    acquired_from_contact_id?: string
    acquisition_type?: string
    bought_by_contact_id?: string
    acquisition_price?: number
    currency?: string
    exchange_rate?: number
    acquisition_discount?: number
    buyer_premium?: number
    taxes?: number
    total_cost?: number
    invoice_number?: string
    invoice_date?: string
    notes?: string
    created_at?: string
    updated_at?: string
    // Joined data
    acquired_from_contact?: { display_name: string }
    bought_by_contact?: { display_name: string }
    object_count?: number
}

// Object data for linking to acquisitions
export type ObjectAcquisitionData = {
    id: string
    price?: number
    discount?: number
    buyer_premium?: number
    taxes?: number
    lot_number?: string
}

export async function getAcquisitions() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('acquisitions')
        .select(`
            *,
            acquired_from_contact:contacts!acquired_from_contact_id(display_name),
            bought_by_contact:contacts!bought_by_contact_id(display_name)
        `)
        .order('acquisition_date', { ascending: false })

    // Get object counts for each acquisition
    if (data) {
        const { data: counts } = await supabase
            .from('object_acquisitions')
            .select('acquisition_id')

        const countMap = (counts || []).reduce((acc, row) => {
            acc[row.acquisition_id] = (acc[row.acquisition_id] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return data.map(acq => ({
            ...acq,
            object_count: countMap[acq.id] || 0
        }))
    }

    return []
}

export async function getAcquisition(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('acquisitions')
        .select(`
            *,
            acquired_from_contact:contacts!acquired_from_contact_id(display_name),
            bought_by_contact:contacts!bought_by_contact_id(display_name)
        `)
        .eq('id', id)
        .single()
    return data
}

export async function getAcquisitionObjects(acquisitionId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('object_acquisitions')
        .select(`
            object_price,
            discount,
            buyer_premium,
            taxes,
            lot_number,
            object:objects(
                id,
                title,
                inventory_number,
                artist:artists(first_name, last_name)
            )
        `)
        .eq('acquisition_id', acquisitionId)
    return data || []
}

export async function createAcquisition(data: Partial<Acquisition>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: acquisition, error } = await supabase
        .from('acquisitions')
        .insert({
            user_id: user.id,
            ...data
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/acquisitions')
    return acquisition
}

export async function updateAcquisition(id: string, data: Partial<Acquisition>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: acquisition, error } = await supabase
        .from('acquisitions')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/acquisitions')
    return acquisition
}

export async function deleteAcquisition(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('acquisitions')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/acquisitions')
}

export async function linkObjectToAcquisition(
    objectId: string,
    acquisitionId: string,
    objectData: ObjectAcquisitionData | number | undefined,
    isUpdate: boolean = false
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Handle backwards compatibility - if objectData is a number, treat it as object_price
    const data = typeof objectData === 'number'
        ? { object_price: objectData }
        : objectData
            ? {
                object_price: objectData.price ?? null,
                discount: objectData.discount ?? 0,
                buyer_premium: objectData.buyer_premium ?? 0,
                taxes: objectData.taxes ?? 0,
                lot_number: objectData.lot_number ?? null
            }
            : {}

    if (isUpdate) {
        // Update existing link
        const { error } = await supabase
            .from('object_acquisitions')
            .update(data)
            .eq('object_id', objectId)
            .eq('acquisition_id', acquisitionId)

        if (error) throw new Error(error.message)
    } else {
        // Insert new link
        const { error } = await supabase
            .from('object_acquisitions')
            .insert({
                object_id: objectId,
                acquisition_id: acquisitionId,
                ...data
            })

        if (error) throw new Error(error.message)
    }

    revalidatePath('/dashboard/acquisitions')
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/objects/${objectId}`)
}

export async function unlinkObjectFromAcquisition(objectId: string, acquisitionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('object_acquisitions')
        .delete()
        .eq('object_id', objectId)
        .eq('acquisition_id', acquisitionId)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/acquisitions')
    revalidatePath('/dashboard')
}
