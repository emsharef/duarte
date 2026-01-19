'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Artist = {
    id: string
    first_name?: string
    last_name?: string
    company?: string
    bio?: string
    birth_year?: number
    death_year?: number
    nationality?: string
    website?: string
    aka?: string
    r2_headshot_key?: string
}

export async function getArtists() {
    const supabase = await createClient()
    const { data } = await supabase.from('artists').select('*').order('last_name', { ascending: true })
    return data || []
}

export async function getArtist(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('artists').select('*').eq('id', id).single()
    return data
}

export async function createArtist(data: Partial<Artist>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: artist, error } = await supabase
        .from('artists')
        .insert({
            user_id: user.id,
            ...data
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/artists')
    return artist
}

export async function updateArtist(id: string, data: Partial<Artist>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: artist, error } = await supabase
        .from('artists')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/artists')
    return artist
}
