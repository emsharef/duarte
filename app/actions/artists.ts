'use server'

import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'

export type Artist = {
    id: string
    first_name?: string | null
    last_name?: string | null
    company?: string | null
    bio?: string | null
    birth_year?: number | null
    death_year?: number | null
    nationality?: string | null
    website?: string | null
    aka?: string | null
    r2_headshot_key?: string | null
}

export async function getArtists() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase.from('artists').select('*').eq('workspace_id', workspaceId).order('last_name', { ascending: true })
    return data || []
}

export async function getArtist(id: string) {
    const { supabase } = await getWorkspaceContext()
    const { data } = await supabase.from('artists').select('*').eq('id', id).single()
    return data
}

export async function createArtist(data: Partial<Artist>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { data: artist, error } = await supabase
        .from('artists')
        .insert({
            workspace_id: workspaceId,
            ...data
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/artists')
    return artist
}

export async function updateArtist(id: string, data: Partial<Artist>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

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
