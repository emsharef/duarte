'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Location = {
    id: string
    name: string
    type?: string
    description?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    parent_id?: string
    created_at?: string
    updated_at?: string
    // Joined data
    parent?: { name: string }
    children_count?: number
    object_count?: number
}

export async function getLocations() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })
    return data || []
}

export async function getLocationsWithCounts() {
    const supabase = await createClient()
    const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })

    if (!locations) return []

    // Get object counts
    const { data: objectCounts } = await supabase
        .from('objects')
        .select('location_id')

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
    const supabase = await createClient()
    const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function createLocation(data: Partial<Location>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: location, error } = await supabase
        .from('locations')
        .insert({
            user_id: user.id,
            name: data.name,
            type: data.type || null,
            description: data.description || null,
            address_line1: data.address_line1 || null,
            address_line2: data.address_line2 || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            country: data.country || null,
            parent_id: data.parent_id || null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/locations')
    return location
}

export async function updateLocation(id: string, data: Partial<Location>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: location, error } = await supabase
        .from('locations')
        .update({
            name: data.name,
            type: data.type || null,
            description: data.description || null,
            address_line1: data.address_line1 || null,
            address_line2: data.address_line2 || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            country: data.country || null,
            parent_id: data.parent_id || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/locations')
    return location
}

export async function deleteLocation(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if location has children
    const { data: children } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', id)

    if (children && children.length > 0) {
        throw new Error('Cannot delete location with sub-locations. Delete or move sub-locations first.')
    }

    // Check if location has objects
    const { data: objects } = await supabase
        .from('objects')
        .select('id')
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
