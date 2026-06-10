'use server'

import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'
import type { TablesInsert } from '@/lib/database.types'

export type Location = {
    id: string
    name: string
    type?: string | null
    description?: string | null
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    postal_code?: string | null
    country?: string | null
    parent_id?: string | null
    created_at?: string
    updated_at?: string
    // Joined data
    parent?: { name: string }
    children_count?: number
    object_count?: number
}

export async function getLocations() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })
    return data || []
}

export async function getLocationsWithCounts() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })

    if (!locations) return []

    // Get object counts
    const { data: objectCounts } = await supabase
        .from('objects')
        .select('location_id')
        .eq('workspace_id', workspaceId)

    const objectCountMap = (objectCounts || []).reduce((acc, obj) => {
        if (obj.location_id) {
            acc[obj.location_id] = (acc[obj.location_id] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)

    // Get child counts
    const childCountMap = locations.reduce((acc, loc) => {
        if (loc.parent_id) {
            acc[loc.parent_id] = (acc[loc.parent_id] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)

    // Build parent name map
    const parentMap = locations.reduce((acc, loc) => {
        acc[loc.id] = loc.name
        return acc
    }, {} as Record<string, string>)

    return locations.map(loc => ({
        ...loc,
        parent: loc.parent_id ? { name: parentMap[loc.parent_id] || '' } : undefined,
        children_count: childCountMap[loc.id] || 0,
        object_count: objectCountMap[loc.id] || 0,
    }))
}

export async function getLocation(id: string) {
    const { supabase } = await getWorkspaceContext()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function createLocation(data: Partial<Location>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // Build insert object with only fields that exist in the database
    const insertData: TablesInsert<'locations'> = {
        workspace_id: workspaceId,
        name: data.name!,
    }

    // Add optional fields if provided
    if (data.type) insertData.type = data.type
    if (data.description) insertData.description = data.description
    if (data.parent_id) insertData.parent_id = data.parent_id

    const { data: location, error } = await supabase
        .from('locations')
        .insert(insertData)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/locations')
    return location
}

export async function updateLocation(id: string, data: Partial<Location>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase } = ctx

    // Build update object with only core fields that exist in the database
    const updateData: Record<string, unknown> = {
        name: data.name,
        type: data.type || null,
        description: data.description || null,
        parent_id: data.parent_id || null,
        updated_at: new Date().toISOString(),
    }

    const { data: location, error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/locations')
    return location
}

export async function deleteLocation(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // Check if location has children
    const { data: children } = await supabase
        .from('locations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('parent_id', id)

    if (children && children.length > 0) {
        throw new Error('Cannot delete location with sub-locations. Delete or move sub-locations first.')
    }

    // Check if location has objects
    const { data: objects } = await supabase
        .from('objects')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('location_id', id)

    if (objects && objects.length > 0) {
        throw new Error('Cannot delete location with objects. Move objects first.')
    }

    const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/locations')
}
