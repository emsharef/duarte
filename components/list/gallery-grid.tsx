'use client'

import Link from 'next/link'
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
        return (
            <div className="flex h-40 items-center justify-center border border-dashed border-border text-sm text-muted-foreground/80">
                No objects match the current filters.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rows.map((row) => {
                if (!row.id) return null
                return (
                    <div key={row.id} className="group relative overflow-hidden bg-card ring-1 ring-border">
                        <input
                            type="checkbox"
                            className="absolute left-2 top-2 z-10 h-4 w-4 cursor-pointer accent-primary"
                            aria-label="Select object"
                            checked={selection.has(row.id)}
                            onChange={() => selection.toggle(row.id!)}
                        />
                        <Link href={`/dashboard/objects/${row.id}${ctxQuery}`} className="block">
                            {row.signed_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={row.signed_url}
                                    alt={row.title ?? ''}
                                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                                    No image
                                </div>
                            )}
                            <div className="space-y-0.5 p-3 pb-1.5">
                                <p className="truncate font-medium">{row.title ?? 'Untitled'}</p>
                                <p className="truncate text-sm text-muted-foreground">{row.artist_name ?? ''}</p>
                            </div>
                        </Link>
                        <div className="px-3 pb-3 pt-0.5">
                            <StatusChip objectId={row.id} status={row.status ?? ''} canEdit={canEdit} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
