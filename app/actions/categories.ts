'use server'

import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'

export type Category = {
    id: string
    name: string
    parent_id?: string | null
    created_at?: string
}

export async function getCategories() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })
    return data || []
}

export async function createCategory(data: { name: string; parent_id?: string }) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { data: category, error } = await supabase
        .from('categories')
        .insert({
            workspace_id: workspaceId,
            name: data.name,
            parent_id: data.parent_id || null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    return category
}

export async function updateCategory(id: string, data: { name: string }) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const name = data.name.trim()
    if (!name) throw new Error('Category name cannot be empty')

    const { data: category, error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    return category
}

export async function deleteCategory(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // Detach any objects referencing this category before deleting it
    const { error: detachError } = await supabase
        .from('objects')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('workspace_id', workspaceId)

    if (detachError) throw new Error(detachError.message)

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
}
