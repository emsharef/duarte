'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Contact = {
    id: string
    contact_type?: string
    first_name?: string
    last_name?: string
    company_name?: string
    display_name?: string
    email?: string
    phone?: string
    mobile?: string
    website?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    notes?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
}

export async function getContacts() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('display_name', { ascending: true })
    return data || []
}

export async function getContactsByType(type: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_type', type)
        .eq('is_active', true)
        .order('display_name', { ascending: true })
    return data || []
}

export async function getContact(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function createContact(data: Partial<Contact>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Generate display_name if not provided
    const display_name = data.display_name ||
        data.company_name ||
        [data.first_name, data.last_name].filter(Boolean).join(' ') ||
        'Unnamed Contact'

    const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
            user_id: user.id,
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/contacts')
}
