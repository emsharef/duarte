import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Shared building blocks for read-only record views (acquisitions, loans,
// contacts, artists, locations, documents). Server-safe — no client hooks.

export function RecordToolbar({
    backHref,
    backLabel,
    editHref,
    children,
}: {
    backHref: string
    backLabel: string
    editHref: string
    children?: React.ReactNode
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm">
                <Link href={backHref}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    {backLabel}
                </Link>
            </Button>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href={editHref}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                    </Link>
                </Button>
                {children}
            </div>
        </div>
    )
}

export function RecordField({ label, children }: { label: string; children?: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">{label}</p>
            <div className="text-sm font-medium">{children || '—'}</div>
        </div>
    )
}

export function RecordSection({
    title,
    count,
    action,
    children,
}: {
    title: string
    count?: number
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    {title}
                    {typeof count === 'number' && (
                        <span className="ml-1.5 text-muted-foreground/60">{count}</span>
                    )}
                </h2>
                {action}
            </div>
            {children}
        </section>
    )
}

export function RecordEmpty({ text }: { text: string }) {
    return <p className="border-y py-4 text-sm text-muted-foreground">{text}</p>
}

export function formatRecordDate(dateStr?: string | null) {
    if (!dateStr) return null
    return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00').toLocaleDateString()
}

export function formatRecordCurrency(amount?: number | null, currency: string = 'USD') {
    if (amount == null) return null
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
