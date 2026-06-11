'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
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
                'flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-[13px] transition-colors',
                active
                    ? 'font-medium text-primary'
                    : 'text-foreground/75 hover:bg-accent/60 hover:text-foreground'
            )}
            style={depth ? { paddingLeft: `${0.5 + depth * 0.75}rem` } : undefined}
        >
            <span className="truncate">{children}</span>
            {count != null && (
                <span
                    className={cn(
                        'ml-2 shrink-0 text-xs tabular-nums',
                        active ? 'text-primary/70' : 'text-muted-foreground/70'
                    )}
                >
                    {count}
                </span>
            )}
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
                className="group flex w-full items-center gap-1.5 px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 transition-colors hover:text-foreground"
            >
                {title}
                <ChevronRight
                    className={cn(
                        'h-3 w-3 text-muted-foreground/50 transition-transform group-hover:text-muted-foreground',
                        open && 'rotate-90'
                    )}
                />
            </button>
            {open && <div className="max-h-64 space-y-px overflow-y-auto pb-1">{children}</div>}
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
        <aside className={cn('space-y-6', className)}>
            <div className="space-y-px">
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
                {artists.length === 0 && <p className="px-2 py-1 text-[13px] text-muted-foreground/60">No artists</p>}
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
                {locationRows.length === 0 && <p className="px-2 py-1 text-[13px] text-muted-foreground/60">No locations</p>}
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
                {categories.length === 0 && <p className="px-2 py-1 text-[13px] text-muted-foreground/60">No categories</p>}
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
                {groups.length === 0 && <p className="px-2 py-1 text-[13px] text-muted-foreground/60">No lists</p>}
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
