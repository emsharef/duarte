'use client'

import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/empty-state'
import { useSelection } from '@/components/list/selection'
import { StatusChip } from '@/components/list/status-chip'
import type { GridRow } from '@/lib/list-columns'

const CTX_CAP = 200

export function GalleryGrid({ rows, canEdit }: { rows: GridRow[]; canEdit: boolean }) {
    const selection = useSelection()
    const ctxIds = rows
        .map((r) => r.id)
        .filter((id): id is string => !!id)
        .slice(0, CTX_CAP)
    const ctxQuery = ctxIds.length ? `?ctx=${ctxIds.join(',')}` : ''

    if (rows.length === 0) {
        return <EmptyState text="No objects match the current filters." />
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rows.map((row) => {
                if (!row.id) return null
                const selected = selection.has(row.id)
                const year = row.date_text ?? row.year_created ?? null
                return (
                    <div
                        key={row.id}
                        className="group relative overflow-hidden rounded-md bg-card ring-1 ring-border transition-shadow hover:shadow-sm"
                    >
                        <div
                            className={cn(
                                'absolute left-2 top-2 z-10 flex items-center justify-center rounded bg-background/90 p-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100',
                                selected && 'opacity-100'
                            )}
                        >
                            <input
                                type="checkbox"
                                className="block h-4 w-4 cursor-pointer accent-primary"
                                aria-label="Select object"
                                checked={selected}
                                onChange={() => selection.toggle(row.id!)}
                            />
                        </div>
                        <Link href={`/dashboard/objects/${row.id}${ctxQuery}`} className="block">
                            <div className="aspect-square w-full overflow-hidden bg-muted">
                                {row.signed_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={row.signed_url}
                                        alt={row.title ?? ''}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <div className="p-3 pb-1.5">
                                <p className="truncate text-sm font-medium">{row.title ?? 'Untitled'}</p>
                                <p className="truncate text-xs text-muted-foreground">{row.artist_name ?? ' '}</p>
                            </div>
                        </Link>
                        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
                            <StatusChip objectId={row.id} status={row.status ?? ''} canEdit={canEdit} />
                            {year ? (
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{year}</span>
                            ) : null}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
