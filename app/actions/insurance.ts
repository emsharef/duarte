'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type InsurancePolicy = {
    id: string
    policy_subject?: string
    policy_number?: string
    insurer_contact_id?: string
    start_date?: string
    end_date?: string
    coverage_type?: string
    total_coverage?: number
    deductible?: number
    premium?: number
    currency?: string
    notes?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
    // Joined data
    insurer_contact?: { display_name: string }
    object_count?: number
}

export async function getInsurancePolicies() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('insurance_policies')
        .select(`
            *,
            insurer_contact:contacts!insurer_contact_id(display_name)
        `)
        .order('end_date', { ascending: false })

    // Get object counts for each policy
    if (data) {
        const { data: counts } = await supabase
            .from('object_insurance')
            .select('policy_id')

        const countMap = (counts || []).reduce((acc, row) => {
            acc[row.policy_id] = (acc[row.policy_id] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return data.map(policy => ({
            ...policy,
            object_count: countMap[policy.id] || 0
        }))
    }

    return []
}

export async function getActiveInsurancePolicies() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('insurance_policies')
        .select(`
            *,
            insurer_contact:contacts!insurer_contact_id(display_name)
        `)
        .eq('is_active', true)
        .order('policy_subject', { ascending: true })
    return data || []
}

export async function getInsurancePolicy(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('insurance_policies')
        .select(`
            *,
            insurer_contact:contacts!insurer_contact_id(display_name)
        `)
        .eq('id', id)
        .single()
    return data
}

export async function getPolicyObjects(policyId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('object_insurance')
        .select(`
            insured_value,
            object:objects(
                id,
                title,
                inventory_number,
                artist:artists(first_name, last_name)
            )
        `)
        .eq('policy_id', policyId)
    return data || []
}

export async function createInsurancePolicy(data: Partial<InsurancePolicy>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: policy, error } = await supabase
        .from('insurance_policies')
        .insert({
            user_id: user.id,
            ...data
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/insurance')
    return policy
}

export async function updateInsurancePolicy(id: string, data: Partial<InsurancePolicy>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: policy, error } = await supabase
        .from('insurance_policies')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/insurance')
    return policy
}

export async function deleteInsurancePolicy(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('insurance_policies')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/insurance')
}

export async function linkObjectToPolicy(objectId: string, policyId: string, insuredValue?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('object_insurance')
        .insert({
            object_id: objectId,
            policy_id: policyId,
            insured_value: insuredValue
        })

    if (error) throw new Error(error.message)

    // Update object's is_insured flag
    await supabase
        .from('objects')
        .update({ is_insured: true })
        .eq('id', objectId)

    revalidatePath('/dashboard/insurance')
    revalidatePath('/dashboard')
}

export async function unlinkObjectFromPolicy(objectId: string, policyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('object_insurance')
        .delete()
        .eq('object_id', objectId)
        .eq('policy_id', policyId)

    if (error) throw new Error(error.message)

    // Check if object has any other policies
    const { data: remaining } = await supabase
        .from('object_insurance')
        .select('policy_id')
        .eq('object_id', objectId)

    // Update is_insured flag based on remaining policies
    await supabase
        .from('objects')
        .update({ is_insured: (remaining && remaining.length > 0) })
        .eq('id', objectId)

    revalidatePath('/dashboard/insurance')
    revalidatePath('/dashboard')
}

export async function getObjectInsurance(objectId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('object_insurance')
        .select(`
            insured_value,
            policy:insurance_policies(
                id,
                policy_subject,
                policy_number,
                start_date,
                end_date,
                is_active
            )
        `)
        .eq('object_id', objectId)
    return data || []
}
