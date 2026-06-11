'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ObjectWithRelations, ActivityEntry, updateObjectFields } from '@/app/dashboard/objects/actions'
import { StatusChip } from './status-chip'
import { Lightbox } from './lightbox'
import { artistName, buildCaption, dimensionText, formatCurrency, formatDate } from './shared'

type ObjectHeaderProps = {
    object: ObjectWithRelations
    activity: ActivityEntry[]
    canEdit: boolean
}

function HeaderField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="text-sm font-medium truncate">{children}</div>
        </div>
    )
}

export function ObjectHeader({ object, activity, canEdit }: ObjectHeaderProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const media = object.object_media || []
    const primaryMedia = media.find((m) => m.is_primary) || media[0]
    const artist = artistName(object.artists)

    const dimsSummary = (object.object_dimensions || [])
        .map((d) => dimensionText(d))
        .filter(Boolean)
        .join('; ')

    // Latest valuation by valuation date
    const latestValuation = [...(object.valuations || [])].sort((a, b) =>
        (b.valuation?.valuation_date || '').localeCompare(a.valuation?.valuation_date || '')
    )[0]

    // Audit line from activity_log (rows arrive newest-first)
    const createdEntry = activity.length > 0 ? activity[activity.length - 1] : null
    const lastEntry = activity[0]

    async function copyCaption() {
        try {
            await navigator.clipboard.writeText(buildCaption(object))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // clipboard unavailable; nothing to roll back
        }
    }

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Hero image */}
                <button
                    type="button"
                    onClick={() => media.length > 0 && setLightboxOpen(true)}
                    className="relative w-full md:w-56 h-56 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                >
                    {primaryMedia?.signed_url ? (
                        <img
                            src={primaryMedia.signed_url}
                            alt={object.title}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                    )}
                    {media.length > 1 && (
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 text-white text-xs px-1.5 py-0.5">
                            {media.length} images
                        </span>
                    )}
                </button>
                <Lightbox media={media} open={lightboxOpen} onOpenChange={setLightboxOpen} />

                {/* Title, key fields, caption */}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{object.title}</h1>
                            <p className="text-muted-foreground">
                                {artist && (
                                    object.artists?.id ? (
                                        <Link href={`/dashboard/artists/${object.artists.id}`} className="hover:underline">
                                            {artist}
                                        </Link>
                                    ) : artist
                                )}
                                {artist && (object.date_text || object.year_created) && ' · '}
                                {object.date_text || object.year_created}
                            </p>
                        </div>
                        <StatusChip
                            status={object.status || 'in_collection'}
                            canEdit={canEdit}
                            onChange={(status) => updateObjectFields(object.id, { status })}
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                        <HeaderField label="Inventory #">{object.inventory_number || '—'}</HeaderField>
                        <HeaderField label="Type">{object.object_type || '—'}</HeaderField>
                        <HeaderField label="Category">{object.categories?.name || '—'}</HeaderField>
                        <HeaderField label="Medium">{object.medium || '—'}</HeaderField>
                        <HeaderField label="Current location">
                            {object.locations?.id ? (
                                <Link href={`/dashboard/locations/${object.locations.id}`} className="hover:underline">
                                    {object.locations.name}
                                </Link>
                            ) : '—'}
                        </HeaderField>
                        <HeaderField label="Permanent location">
                            {object.permanent_location?.id ? (
                                <Link href={`/dashboard/locations/${object.permanent_location.id}`} className="hover:underline">
                                    {object.permanent_location.name}
                                </Link>
                            ) : '—'}
                        </HeaderField>
                        <HeaderField label="Dimensions">{dimsSummary || '—'}</HeaderField>
                        <HeaderField label="Current value">
                            {latestValuation
                                ? `${formatCurrency(latestValuation.appraised_value, latestValuation.valuation?.currency || 'USD')}`
                                : '—'}
                        </HeaderField>
                    </div>

                    {/* Caption block */}
                    <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 p-3">
                        <div className="text-sm leading-snug">
                            {artist && <p>{artist}</p>}
                            <p>
                                <span className="italic">{object.title}</span>
                                {(object.date_text || object.year_created) && `, ${object.date_text || object.year_created}`}
                            </p>
                            {object.medium && <p>{object.medium}</p>}
                            {(() => {
                                const dim = (object.object_dimensions || []).find((d) => d.height != null || d.width != null || d.depth != null)
                                const text = dim ? dimensionText(dim, { bothUnits: true }) : null
                                return text ? <p>{text}</p> : null
                            })()}
                            {object.inventory_number && <p>Inventory #: {object.inventory_number}</p>}
                        </div>
                        <Button variant="outline" size="sm" onClick={copyCaption} className="shrink-0">
                            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                            {copied ? 'Copied' : 'Copy Caption'}
                        </Button>
                    </div>

                    {/* Audit line */}
                    {(createdEntry || lastEntry) && (
                        <p className="text-xs text-muted-foreground">
                            {createdEntry && `Created ${formatDate(createdEntry.created_at)}`}
                            {createdEntry && lastEntry && lastEntry.id !== createdEntry.id && ' · '}
                            {lastEntry && lastEntry.id !== (createdEntry?.id ?? '') &&
                                `Last modified ${formatDate(lastEntry.created_at)}${lastEntry.user_email ? ` by ${lastEntry.user_email}` : ''}`}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
