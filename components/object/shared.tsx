'use client'

import { useEffect, useState } from 'react'
import { ObjectWithRelations } from '@/app/dashboard/objects/actions'

// ---------------------------------------------------------------------------
// Minimal toast (no toast library in the project)
// ---------------------------------------------------------------------------

type ToastMsg = { id: number; message: string }

let listeners: Array<(t: ToastMsg) => void> = []
let nextToastId = 1

export function toastError(message: string) {
    const t = { id: nextToastId++, message }
    listeners.forEach((l) => l(t))
}

export function Toasts() {
    const [toasts, setToasts] = useState<ToastMsg[]>([])

    useEffect(() => {
        const push = (t: ToastMsg) => {
            setToasts((prev) => [...prev, t])
            setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000)
        }
        listeners.push(push)
        return () => { listeners = listeners.filter((l) => l !== push) }
    }, [])

    if (toasts.length === 0) return null
    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2">
            {toasts.map((t) => (
                <div key={t.id} className="rounded-md bg-red-600 text-white text-sm px-4 py-2 shadow-lg max-w-sm">
                    {t.message}
                </div>
            ))}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function contactName(contact?: { first_name?: string | null; last_name?: string | null; display_name?: string | null } | null): string {
    if (!contact) return 'Unknown'
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    return name || contact.display_name || 'Unknown'
}

export function artistName(artist?: { first_name?: string | null; last_name?: string | null; company?: string | null } | null): string | null {
    if (!artist) return null
    return `${artist.first_name || ''} ${artist.last_name || ''}`.trim() || artist.company || null
}

export function formatCurrency(amount?: number | null, currency: string = 'USD'): string {
    if (amount == null) return '—'
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    } catch {
        return `${amount} ${currency}`
    }
}

export function formatDate(date?: string | null): string {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date?: string | null): string {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export type DimensionRow = {
    id?: string
    type?: string
    height?: number | null
    width?: number | null
    depth?: number | null
    unit?: string
}

function convertValue(v: number, fromUnit: string): number {
    const converted = fromUnit === 'cm' ? v / 2.54 : v * 2.54
    return Math.round(converted * 10) / 10
}

export function dimensionText(d: DimensionRow, options?: { bothUnits?: boolean }): string | null {
    const parts = [d.height, d.width, d.depth].filter((v): v is number => v != null)
    if (parts.length === 0) return null
    const unit = d.unit || 'cm'
    let text = `${parts.join(' × ')} ${unit}`
    if (options?.bothUnits) {
        const otherUnit = unit === 'cm' ? 'in' : 'cm'
        text += ` (${parts.map((v) => convertValue(v, unit)).join(' × ')} ${otherUnit})`
    }
    return text
}

// ---------------------------------------------------------------------------
// Caption (Arternal pattern): artist / title, year / medium / dims / inventory #
// ---------------------------------------------------------------------------

export function buildCaption(object: ObjectWithRelations): string {
    const lines: string[] = []
    const artist = artistName(object.artists)
    if (artist) lines.push(artist)

    let titleLine = object.title
    const year = object.date_text || object.year_created
    if (year) titleLine += `, ${year}`
    lines.push(titleLine)

    if (object.medium) lines.push(object.medium)

    const dim = (object.object_dimensions || []).find((d) => d.height != null || d.width != null || d.depth != null)
    if (dim) {
        const text = dimensionText(dim, { bothUnits: true })
        if (text) lines.push(text)
    }

    if (object.inventory_number) lines.push(`Inventory #: ${object.inventory_number}`)
    return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Small layout pieces shared by the related-record tabs
// ---------------------------------------------------------------------------

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{title}</h3>
            {action}
        </div>
    )
}

export function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
