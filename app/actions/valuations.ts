'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Valuation = {
    id: string
    valuation_subject?: string
    valuation_date?: string
    valuation_status?: string
    appraiser_contact_id?: string
    value_type?: string
    total_value?: number
    currency?: string
    notes?: string
    created_at?: string
    updated_at?: string
    // Joined data
    appraiser_contact?: { display_name: string }
    object_count?: number
}

export type ObjectValuation = {
    id: string
    object_id: string
    valuation_id: string
    appraised_value?: number
    low_estimate?: number
    high_estimate?: number
    notes?: string
    created_at?: string
}

export async function getValuations() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('valuations')
        .select(`
            *,
            appraiser_contact:contacts!appraiser_contact_id(display_name)
        `)
        .order('valuation_date', { ascending: false })

    // Get object counts for each valuation
    if (data) {
        const { data: counts } = await supabase
            .from('object_valuations')
            .select('valuation_id')

        const countMap = (counts || []).reduce((acc, row) => {
            acc[row.valuation_id] = (acc[row.valuation_id] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return data.map(val => ({
            ...val,
            object_count: countMap[val.id] || 0
        }))
    }

    return []
}

export async function getValuation(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('valuations')
        .select(`
            *,
            appraiser_contact:contacts!appraiser_contact_id(display_name)
        `)
        .eq('id', id)
        .single()
    return data
}

export async function getValuationObjects(valuationId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('object_valuations')
        .select(`
            id,
            appraised_value,
            low_estimate,
            high_estimate,
            notes,
            object:objects(
                id,
                title,
                inventory_number,
                artist:artists(first_name, last_name)
            )
        `)
        .eq('valuation_id', valuationId)
    return data || []
}

export async function createValuation(data: Partial<Valuation>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: valuation, error } = await supabase
        .from('valuations')
        .insert({
            user_id: user.id,
            valuation_status: 'Pending',
            ...data
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/valuations')
    return valuation
}

export async function updateValuation(id: string, data: Partial<Valuation>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: valuation, error } = await supabase
        .from('valuations')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/valuations')
    return valuation
}

export async function deleteValuation(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('valuations')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/valuations')
}

export async function addObjectToValuation(
    valuationId: string,
    objectId: string,
    values: {
        appraised_value?: number
        low_estimate?: number
        high_estimate?: number
        notes?: string
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('object_valuations')
        .insert({
            valuation_id: valuationId,
            object_id: objectId,
            ...values
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Update total value
    await recalculateValuationTotal(valuationId)

    revalidatePath('/dashboard/valuations')
    return data
}

export async function updateObjectValuation(
    id: string,
    values: {
        appraised_value?: number
        low_estimate?: number
        high_estimate?: number
        notes?: string
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get valuation_id first
    const { data: objVal } = await supabase
        .from('object_valuations')
        .select('valuation_id')
        .eq('id', id)
        .single()

    const { data, error } = await supabase
        .from('object_valuations')
        .update(values)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Update total value
    if (objVal) {
        await recalculateValuationTotal(objVal.valuation_id)
    }

    revalidatePath('/dashboard/valuations')
    return data
}

export async function removeObjectFromValuation(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get valuation_id first
    const { data: objVal } = await supabase
        .from('object_valuations')
        .select('valuation_id')
        .eq('id', id)
        .single()

    const { error } = await supabase
        .from('object_valuations')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)

    // Update total value
    if (objVal) {
        await recalculateValuationTotal(objVal.valuation_id)
    }

    revalidatePath('/dashboard/valuations')
}

async function recalculateValuationTotal(valuationId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('object_valuations')
        .select('appraised_value')
        .eq('valuation_id', valuationId)

    const total = (data || []).reduce(
        (sum, item) => sum + (item.appraised_value || 0),
        0
    )

    await supabase
        .from('valuations')
        .update({ total_value: total })
        .eq('id', valuationId)
}

export async function getObjectValuations(objectId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('object_valuations')
        .select(`
            id,
            appraised_value,
            low_estimate,
            high_estimate,
            notes,
            valuation:valuations(
                id,
                valuation_subject,
                valuation_date,
                value_type,
                valuation_status,
                appraiser_contact:contacts!appraiser_contact_id(display_name)
            )
        `)
        .eq('object_id', objectId)
        .order('created_at', { ascending: false })
    return data || []
}
