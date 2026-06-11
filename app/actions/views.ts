'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import type { Json, Tables, TablesInsert } from '@/lib/database.types'
import {
    LIST_STATUSES,
    STATUS_BUCKETS,
    type ObjectsGridRow,
    type SavedViewConfig,
    type StatusBucket,
} from '@/lib/list-columns'

export type SavedView = Tables<'saved_views'>

export type GridFilters = {
    bucket?: StatusBucket
    artistId?: string
    locationId?: string
    categoryId?: string
    groupId?: string
    search?: string
    searchField?: string
}

const SEARCHABLE_FIELDS = ['title', 'artist_name', 'inventory_number', 'medium', 'description']

export async function getObjectsGrid(filters: GridFilters = {}): Promise<ObjectsGridRow[]> {
    const { supabase, workspaceId } = await getWorkspaceContext()

    // Group (list) membership is not on the view; resolve ids first
    let groupObjectIds: string[] | null = null
    if (filters.groupId) {
        const { data } = await supabase
            .from('object_groups')
            .select('object_id')
            .eq('workspace_id', workspaceId)
            .eq('group_id', filters.groupId)
        groupObjectIds = (data ?? []).map((r) => r.object_id)
        if (groupObjectIds.length === 0) return []
    }

    let query = supabase
        .from('objects_grid')
        .select('*')
        .eq('workspace_id', workspaceId)

    if (filters.bucket && STATUS_BUCKETS[filters.bucket]) {
        query = query.in('status', [...STATUS_BUCKETS[filters.bucket]])
    }
    if (filters.artistId) query = query.eq('artist_id', filters.artistId)
    if (filters.locationId) query = query.eq('location_id', filters.locationId)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (groupObjectIds) query = query.in('id', groupObjectIds)

    const search = filters.search?.trim()
    if (search) {
        // Strip characters that would break PostgREST or/ilike syntax
        const term = search.replace(/[,()]/g, ' ').trim()
        if (term) {
            const field = filters.searchField
            if (field && field !== 'all' && SEARCHABLE_FIELDS.includes(field)) {
                query = query.ilike(field, `%${term}%`)
            } else {
                query = query.or(SEARCHABLE_FIELDS.map((f) => `${f}.ilike.%${term}%`).join(','))
            }
        }
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
}

// ---------- Saved views ----------

export async function listSavedViews(): Promise<SavedView[]> {
    const { supabase, workspaceId, userId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('saved_views')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('entity_type', 'objects')
        .order('name', { ascending: true })
    return data ?? []
}

export async function saveView(name: string, config: SavedViewConfig): Promise<SavedView> {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId, userId } = ctx

    const trimmed = name.trim()
    if (!trimmed) throw new Error('View name is required')

    const { data, error } = await supabase
        .from('saved_views')
        .insert({
            workspace_id: workspaceId,
            user_id: userId,
            entity_type: 'objects',
            name: trimmed,
            config: config as unknown as Json,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    return data
}

export async function deleteView(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId, userId } = ctx

    const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
}

// ---------- Batch actions ----------

export async function batchSetStatus(ids: string[], status: string) {
    if (ids.length === 0) return
    if (!LIST_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`)

    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { error } = await supabase
        .from('objects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .in('id', ids)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
}

export async function batchSetLocation(ids: string[], locationId: string | null) {
    if (ids.length === 0) return

    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { error } = await supabase
        .from('objects')
        .update({ location_id: locationId, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .in('id', ids)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
}

export async function batchAddToList(ids: string[], groupId: string) {
    if (ids.length === 0) return

    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const rows: TablesInsert<'object_groups'>[] = ids.map((objectId) => ({
        object_id: objectId,
        group_id: groupId,
        workspace_id: workspaceId,
    }))

    const { error } = await supabase
        .from('object_groups')
        .upsert(rows, { onConflict: 'object_id,group_id', ignoreDuplicates: true })

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
}

export async function batchDelete(ids: string[]) {
    if (ids.length === 0) return

    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { error } = await supabase
        .from('objects')
        .delete()
        .eq('workspace_id', workspaceId)
        .in('id', ids)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
}

// Create a list (group) inline from the "Add to list" batch action
export async function createGroup(name: string): Promise<Tables<'groups'>> {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const trimmed = name.trim()
    if (!trimmed) throw new Error('List name is required')

    const { data, error } = await supabase
        .from('groups')
        .insert({ workspace_id: workspaceId, name: trimmed })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    return data
}
