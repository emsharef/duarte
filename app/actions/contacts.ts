'use server'

import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'

export type Contact = {
    id: string
    contact_type?: string | null
    first_name?: string | null
    last_name?: string | null
    company_name?: string | null
    display_name?: string | null
    email?: string | null
    phone?: string | null
    mobile?: string | null
    website?: string | null
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    postal_code?: string | null
    country?: string | null
    notes?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
}

export async function getContacts() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('display_name', { ascending: true })
    return data || []
}

export async function getContactsByType(type: string) {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('contact_type', type)
        .eq('is_active', true)
        .order('display_name', { ascending: true })
    return data || []
}

export async function getContact(id: string) {
    const { supabase } = await getWorkspaceContext()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function getContactAcquisitions(contactId: string) {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('acquisitions')
        .select('id, acquisition_subject, acquisition_type, acquisition_date, total_cost, currency, acquired_from_contact_id, bought_by_contact_id')
        .eq('workspace_id', workspaceId)
        .or(`acquired_from_contact_id.eq.${contactId},bought_by_contact_id.eq.${contactId}`)
        .order('acquisition_date', { ascending: false })
    return data || []
}

export async function getContactLoans(contactId: string) {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('loans')
        .select('id, loan_subject, direction, status, start_date, end_date, borrower_contact_id, lender_contact_id')
        .eq('workspace_id', workspaceId)
        .or(`borrower_contact_id.eq.${contactId},lender_contact_id.eq.${contactId}`)
        .order('start_date', { ascending: false })
    return data || []
}

export async function createContact(data: Partial<Contact>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // Generate display_name if not provided
    const display_name = data.display_name ||
        data.company_name ||
        [data.first_name, data.last_name].filter(Boolean).join(' ') ||
        'Unnamed Contact'

    const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
            workspace_id: workspaceId,
            ...data,
            display_name
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/contacts')
    return contact
}

export async function updateContact(id: string, data: Partial<Contact>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    // Update display_name if name fields changed
    const display_name = data.display_name ||
        data.company_name ||
        [data.first_name, data.last_name].filter(Boolean).join(' ')

    const { data: contact, error } = await supabase
        .from('contacts')
        .update({
            ...data,
            display_name: display_name || undefined,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/contacts')
    return contact
}

export async function deleteContact(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/contacts')
}
