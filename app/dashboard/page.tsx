import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2 } from '@/lib/r2'
import { getWorkspaceContext } from '@/lib/workspace'
import { getObjectsGrid, listSavedViews, type GridFilters } from '@/app/actions/views'
import { STATUS_BUCKETS, type GridRow, type StatusBucket } from '@/lib/list-columns'
import { FilterRail, type RailItem } from '@/components/list/filter-rail'
import { InventoryView } from '@/components/list/inventory-view'
import { SelectionProvider } from '@/components/list/selection'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function str(value: string | string[] | undefined): string | undefined {
    return typeof value === 'string' && value ? value : undefined
}

function bucketOf(status: string | null): StatusBucket | null {
    if (!status) return null
    for (const bucket of Object.keys(STATUS_BUCKETS) as StatusBucket[]) {
        if ((STATUS_BUCKETS[bucket] as readonly string[]).includes(status)) return bucket
    }
    return null
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const { supabase, workspaceId, role } = await getWorkspaceContext()
    const canEdit = role !== 'viewer'

    const bucketParam = str(sp.bucket)
    const filters: GridFilters = {
        bucket: (['current', 'incoming', 'former'] as const).find((b) => b === bucketParam),
        artistId: str(sp.artist),
        locationId: str(sp.location),
        categoryId: str(sp.category),
        groupId: str(sp.group),
        search: str(sp.q),
        searchField: str(sp.field),
    }

    const [
        gridRows,
        savedViews,
        { data: facets },
        { data: artists },
        { data: locations },
        { data: categories },
        { data: groups },
        { data: objectGroups },
        { data: workspace },
    ] = await Promise.all([
        getObjectsGrid(filters),
        listSavedViews(),
        supabase
            .from('objects')
            .select('id, status, artist_id, location_id, category_id')
            .eq('workspace_id', workspaceId),
        supabase
            .from('artists')
            .select('id, first_name, last_name, company')
            .eq('workspace_id', workspaceId)
            .order('last_name', { ascending: true }),
        supabase
            .from('locations')
            .select('id, name, parent_id')
            .eq('workspace_id', workspaceId)
            .order('name', { ascending: true }),
        supabase
            .from('categories')
            .select('id, name')
            .eq('workspace_id', workspaceId)
            .order('name', { ascending: true }),
        supabase
            .from('groups')
            .select('id, name')
            .eq('workspace_id', workspaceId)
            .order('name', { ascending: true }),
        supabase
            .from('object_groups')
            .select('object_id, group_id')
            .eq('workspace_id', workspaceId),
        supabase
            .from('workspaces')
            .select('default_currency')
            .eq('id', workspaceId)
            .single(),
    ])

    const defaultCurrency = workspace?.default_currency ?? 'USD'

    // Signed thumbnail URLs: objects_grid has no media, so fetch primary media separately
    const objectIds = gridRows.map((r) => r.id).filter((id): id is string => !!id)
    const thumbKeyByObject: Record<string, string> = {}
    if (objectIds.length > 0) {
        const { data: media } = await supabase
            .from('object_media')
            .select('object_id, r2_key_thumbnail, is_primary')
            .in('object_id', objectIds)
        for (const m of media ?? []) {
            if (!m.r2_key_thumbnail) continue
            if (m.is_primary || !thumbKeyByObject[m.object_id]) {
                thumbKeyByObject[m.object_id] = m.r2_key_thumbnail
            }
        }
    }

    const signedUrlByObject: Record<string, string> = {}
    await Promise.all(
        Object.entries(thumbKeyByObject).map(async ([objectId, key]) => {
            try {
                const command = new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                })
                signedUrlByObject[objectId] = await getSignedUrl(r2, command, { expiresIn: 3600 })
            } catch (err) {
                console.error(`Error generating signed URL for ${key}:`, err)
            }
        })
    )

    const rows: GridRow[] = gridRows.map((r) => ({
        ...r,
        signed_url: r.id ? (signedUrlByObject[r.id] ?? null) : null,
    }))

    // Rail counts from the lightweight workspace-wide facet query
    const bucketCounts: Record<StatusBucket, number> = { current: 0, incoming: 0, former: 0 }
    const artistCounts: Record<string, number> = {}
    const locationCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    for (const o of facets ?? []) {
        const bucket = bucketOf(o.status)
        if (bucket) bucketCounts[bucket] += 1
        if (o.artist_id) artistCounts[o.artist_id] = (artistCounts[o.artist_id] ?? 0) + 1
        if (o.location_id) locationCounts[o.location_id] = (locationCounts[o.location_id] ?? 0) + 1
        if (o.category_id) categoryCounts[o.category_id] = (categoryCounts[o.category_id] ?? 0) + 1
    }
    const groupCounts: Record<string, number> = {}
    for (const og of objectGroups ?? []) {
        groupCounts[og.group_id] = (groupCounts[og.group_id] ?? 0) + 1
    }

    const artistItems: RailItem[] = (artists ?? []).map((a) => ({
        id: a.id,
        name:
            `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.company || 'Unnamed artist',
        count: artistCounts[a.id] ?? 0,
    }))
    const locationItems: RailItem[] = (locations ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        parent_id: l.parent_id,
        count: locationCounts[l.id] ?? 0,
    }))
    const categoryItems: RailItem[] = (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        count: categoryCounts[c.id] ?? 0,
    }))
    const groupItems: RailItem[] = (groups ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        count: groupCounts[g.id] ?? 0,
    }))

    const mode: 'table' | 'gallery' = str(sp.mode) === 'gallery' ? 'gallery' : 'table'

    return (
        <SelectionProvider scope="objects">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                        <p className="text-muted-foreground">Manage your art collection.</p>
                    </div>
                </div>
                <div className="flex items-start gap-6">
                    <FilterRail
                        className="hidden w-56 shrink-0 md:block"
                        bucketCounts={bucketCounts}
                        artists={artistItems}
                        locations={locationItems}
                        categories={categoryItems}
                        groups={groupItems}
                    />
                    <div className="min-w-0 flex-1">
                        <InventoryView
                            rows={rows}
                            savedViews={savedViews}
                            groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name }))}
                            defaultCurrency={defaultCurrency}
                            canEdit={canEdit}
                            mode={mode}
                            initialSearch={str(sp.q) ?? ''}
                            initialSearchField={str(sp.field) ?? 'all'}
                        />
                    </div>
                </div>
            </div>
        </SelectionProvider>
    )
}
