'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, ListFilter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { STATUS_BUCKET_LABELS, type StatusBucket } from '@/lib/list-columns'

export type FilterItem = {
    id: string
    name: string
    count: number
    parent_id?: string | null
}

export type FilterData = {
    totalCount: number
    bucketCounts: Record<StatusBucket, number>
    artists: FilterItem[]
    locations: FilterItem[]
    categories: FilterItem[]
    groups: FilterItem[]
}

const BUCKETS: StatusBucket[] = ['current', 'incoming', 'former']

const FILTER_SECTIONS = [
    { param: 'artist', label: 'Artist', itemsKey: 'artists' },
    { param: 'location', label: 'Location', itemsKey: 'locations' },
    { param: 'category', label: 'Category', itemsKey: 'categories' },
    { param: 'group', label: 'List', itemsKey: 'groups' },
] as const

function useParamNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function setParams(mutate: (params: URLSearchParams) => void) {
        const params = new URLSearchParams(searchParams.toString())
        mutate(params)
        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    return { searchParams, setParams }
}

// Flatten a parent_id hierarchy into depth-annotated rows
function flattenTree(items: FilterItem[]): { item: FilterItem; depth: number }[] {
    const byParent = new Map<string | null, FilterItem[]>()
    const ids = new Set(items.map((i) => i.id))
    for (const item of items) {
        // Treat orphans (parent outside workspace data) as roots
        const parent = item.parent_id && ids.has(item.parent_id) ? item.parent_id : null
        const list = byParent.get(parent) ?? []
        list.push(item)
        byParent.set(parent, list)
    }
    const out: { item: FilterItem; depth: number }[] = []
    const visit = (parent: string | null, depth: number) => {
        for (const item of byParent.get(parent) ?? []) {
            out.push({ item, depth })
            visit(item.id, depth + 1)
        }
    }
    visit(null, 0)
    return out
}

/** Quiet pill-tab row for the status buckets, rendered directly above the table. */
export function StatusTabs({ data }: { data: FilterData }) {
    const { searchParams, setParams } = useParamNavigation()
    const active = searchParams.get('bucket')

    const tabs: { key: StatusBucket | null; label: string; count: number }[] = [
        { key: null, label: 'All', count: data.totalCount },
        ...BUCKETS.map((b) => ({ key: b, label: STATUS_BUCKET_LABELS[b], count: data.bucketCounts[b] })),
    ]

    return (
        <div
            className="flex items-center gap-1 overflow-x-auto whitespace-nowrap md:flex-wrap"
            role="tablist"
            aria-label="Status"
        >
            {tabs.map((tab) => {
                const isActive = tab.key ? active === tab.key : !active
                return (
                    <button
                        key={tab.label}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() =>
                            setParams((p) => {
                                if (tab.key) p.set('bucket', tab.key)
                                else p.delete('bucket')
                            })
                        }
                        className={cn(
                            'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors',
                            isActive
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                    >
                        {tab.label}
                        <span
                            className={cn(
                                'text-xs tabular-nums',
                                isActive ? 'text-primary/70' : 'text-muted-foreground/70'
                            )}
                        >
                            {tab.count}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

/** Toolbar popover with compact searchable sections for Artist, Location, Category, List. */
export function FilterButton({ data }: { data: FilterData }) {
    const { searchParams, setParams } = useParamNavigation()
    const [open, setOpen] = useState(false)

    const locationRows = useMemo(() => flattenTree(data.locations), [data.locations])
    const activeCount = FILTER_SECTIONS.filter((s) => searchParams.get(s.param)).length

    function toggle(param: string, id: string) {
        setParams((params) => {
            if (params.get(param) === id) params.delete(param)
            else params.set(param, id)
        })
    }

    function renderItem(param: string, sectionLabel: string, item: FilterItem, depth = 0) {
        const selected = searchParams.get(param) === item.id
        return (
            <CommandItem
                key={item.id}
                value={`${sectionLabel} ${item.name} ${item.id}`}
                onSelect={() => toggle(param, item.id)}
                className="gap-2 text-[13px]"
                style={depth ? { paddingLeft: `${0.5 + depth * 0.75}rem` } : undefined}
            >
                <Check
                    className={cn('h-3.5 w-3.5 shrink-0 text-primary', selected ? 'opacity-100' : 'opacity-0')}
                />
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground/70">{item.count}</span>
            </CommandItem>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    Filter
                    {activeCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium tabular-nums text-primary-foreground">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Filter by artist, location…" />
                    <CommandList className="max-h-80">
                        <CommandEmpty>No matches.</CommandEmpty>
                        <CommandGroup heading="Artist">
                            {data.artists.map((a) => renderItem('artist', 'Artist', a))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Location">
                            {locationRows.map(({ item, depth }) =>
                                renderItem('location', 'Location', item, depth)
                            )}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Category">
                            {data.categories.map((c) => renderItem('category', 'Category', c))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="List">
                            {data.groups.map((g) => renderItem('group', 'List', g))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

/** Removable chips for the active filters, rendered under the toolbar. */
export function FilterChips({ data }: { data: FilterData }) {
    const { searchParams, setParams } = useParamNavigation()

    const chips = FILTER_SECTIONS.flatMap((section) => {
        const id = searchParams.get(section.param)
        if (!id) return []
        const item = data[section.itemsKey].find((i) => i.id === id)
        return [{ param: section.param, label: section.label, name: item?.name ?? 'Unknown' }]
    })

    if (chips.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
                <span
                    key={chip.param}
                    className="inline-flex h-6 items-center gap-1 rounded-full border border-input bg-background pl-2.5 pr-1 text-xs text-foreground/80"
                >
                    <span className="text-muted-foreground">{chip.label}:</span>
                    <span className="max-w-40 truncate font-medium">{chip.name}</span>
                    <button
                        type="button"
                        onClick={() => setParams((p) => p.delete(chip.param))}
                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={`Remove ${chip.label} filter`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            {chips.length > 1 && (
                <button
                    type="button"
                    onClick={() => setParams((p) => FILTER_SECTIONS.forEach((s) => p.delete(s.param)))}
                    className="ml-1 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                >
                    Clear all
                </button>
            )}
        </div>
    )
}
