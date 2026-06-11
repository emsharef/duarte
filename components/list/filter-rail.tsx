'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_BUCKET_LABELS, type StatusBucket } from '@/lib/list-columns'

export type RailItem = {
    id: string
    name: string
    count: number
    parent_id?: string | null
}

type FilterRailProps = {
    bucketCounts: Record<StatusBucket, number>
    artists: RailItem[]
    locations: RailItem[]
    categories: RailItem[]
    groups: RailItem[]
    className?: string
}

const BUCKETS: StatusBucket[] = ['current', 'incoming', 'former']

function RailButton({
    active,
    onClick,
    children,
    count,
    depth = 0,
}: {
    active: boolean
    onClick: () => void
    children: ReactNode
    count?: number
    depth?: number
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                active && 'bg-accent font-medium'
            )}
            style={depth ? { paddingLeft: `${0.5 + depth * 0.75}rem` } : undefined}
        >
            <span className="truncate">{children}</span>
            {count != null && <span className="ml-2 shrink-0 text-xs text-muted-foreground">{count}</span>}
        </button>
    )
}

function RailSection({ title, children }: { title: string; children: ReactNode }) {
    const [open, setOpen] = useState(true)
    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
                {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {title}
            </button>
            {open && <div className="max-h-64 space-y-0.5 overflow-y-auto">{children}</div>}
        </div>
    )
}

// Flatten a parent_id hierarchy into depth-annotated rows
function flattenTree(items: RailItem[]): { item: RailItem; depth: number }[] {
    const byParent = new Map<string | null, RailItem[]>()
    const ids = new Set(items.map((i) => i.id))
    for (const item of items) {
        // Treat orphans (parent outside workspace data) as roots
        const parent = item.parent_id && ids.has(item.parent_id) ? item.parent_id : null
        const list = byParent.get(parent) ?? []
        list.push(item)
        byParent.set(parent, list)
    }
    const out: { item: RailItem; depth: number }[] = []
    const visit = (parent: string | null, depth: number) => {
        for (const item of byParent.get(parent) ?? []) {
            out.push({ item, depth })
            visit(item.id, depth + 1)
        }
    }
    visit(null, 0)
    return out
}

export function FilterRail({ bucketCounts, artists, locations, categories, groups, className }: FilterRailProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const locationRows = useMemo(() => flattenTree(locations), [locations])

    function toggleParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (params.get(key) === value) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <aside className={cn('space-y-4', className)}>
            <div className="space-y-0.5">
                {BUCKETS.map((bucket) => (
                    <RailButton
                        key={bucket}
                        active={searchParams.get('bucket') === bucket}
                        onClick={() => toggleParam('bucket', bucket)}
                        count={bucketCounts[bucket]}
                    >
                        {STATUS_BUCKET_LABELS[bucket]}
                    </RailButton>
                ))}
            </div>

            <RailSection title="Artists">
                {artists.length === 0 && <p className="px-2 py-1 text-sm text-muted-foreground">No artists</p>}
                {artists.map((a) => (
                    <RailButton
                        key={a.id}
                        active={searchParams.get('artist') === a.id}
                        onClick={() => toggleParam('artist', a.id)}
                        count={a.count}
                    >
                        {a.name}
                    </RailButton>
                ))}
            </RailSection>

            <RailSection title="Locations">
                {locationRows.length === 0 && <p className="px-2 py-1 text-sm text-muted-foreground">No locations</p>}
                {locationRows.map(({ item, depth }) => (
                    <RailButton
                        key={item.id}
                        active={searchParams.get('location') === item.id}
                        onClick={() => toggleParam('location', item.id)}
                        count={item.count}
                        depth={depth}
                    >
                        {item.name}
                    </RailButton>
                ))}
            </RailSection>

            <RailSection title="Categories">
                {categories.length === 0 && <p className="px-2 py-1 text-sm text-muted-foreground">No categories</p>}
                {categories.map((c) => (
                    <RailButton
                        key={c.id}
                        active={searchParams.get('category') === c.id}
                        onClick={() => toggleParam('category', c.id)}
                        count={c.count}
                    >
                        {c.name}
                    </RailButton>
                ))}
            </RailSection>

            <RailSection title="Lists">
                {groups.length === 0 && <p className="px-2 py-1 text-sm text-muted-foreground">No lists</p>}
                {groups.map((g) => (
                    <RailButton
                        key={g.id}
                        active={searchParams.get('group') === g.id}
                        onClick={() => toggleParam('group', g.id)}
                        count={g.count}
                    >
                        {g.name}
                    </RailButton>
                ))}
            </RailSection>
        </aside>
    )
}
