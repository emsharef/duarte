'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { RecordSection, RecordEmpty, formatRecordCurrency } from '@/components/record-view'
import { toastError } from '@/components/object/shared'
import type { ObjectForSelection } from '@/app/dashboard/objects/actions'

export type LinkedObject = {
    id: string
    title: string
    inventory_number?: string | null
    artist_name?: string | null
    value?: number | null
}

type LinkedObjectsSectionProps = {
    title: string
    items: LinkedObject[]
    currency: string
    valueLabel: string
    emptyText: string
    canEdit: boolean
    // Returns the full pool of selectable objects; section filters out linked ids.
    loadOptions: () => Promise<ObjectForSelection[]>
    // Link the given object (optional value); the page binds entity id + action.
    onLink: (objectId: string, value: number | null) => Promise<void>
    // Unlink the given object; the page binds entity id + action.
    onUnlink: (objectId: string) => Promise<void>
}

// Client section for the module view pages: renders the linked-objects list
// with hover remove controls plus an "Add object" dialog. Mutations call the
// per-page bound server actions then refresh the route.
export function LinkedObjectsSection({
    title, items, currency, valueLabel, emptyText, canEdit, loadOptions, onLink, onUnlink,
}: LinkedObjectsSectionProps) {
    const router = useRouter()
    const [addOpen, setAddOpen] = useState(false)
    const [options, setOptions] = useState<ObjectForSelection[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState('')
    const [value, setValue] = useState('')
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState<string | null>(null)

    const linkedIds = useMemo(() => new Set(items.map((i) => i.id)), [items])

    useEffect(() => {
        if (!addOpen) return
        setQuery('')
        setSelectedId('')
        setValue('')
        setLoading(true)
        loadOptions()
            .then((opts) => setOptions(opts))
            .catch(() => setOptions([]))
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addOpen])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return options
            .filter((o) => !linkedIds.has(o.id))
            .filter((o) => {
                if (!q) return true
                return (
                    o.title.toLowerCase().includes(q) ||
                    (o.inventory_number || '').toLowerCase().includes(q) ||
                    (o.artist_name || '').toLowerCase().includes(q)
                )
            })
    }, [options, query, linkedIds])

    async function handleAdd() {
        if (!selectedId) {
            toastError('Select an object to link')
            return
        }
        setSaving(true)
        try {
            await onLink(selectedId, value ? Number(value) : null)
            setAddOpen(false)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to link object')
        } finally {
            setSaving(false)
        }
    }

    async function handleUnlink(objectId: string) {
        if (!confirm('Remove this object from the record?')) return
        setBusyId(objectId)
        try {
            await onUnlink(objectId)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to remove object')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <RecordSection
            title={title}
            count={items.length}
            action={canEdit && (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add object
                </Button>
            )}
        >
            {items.length === 0 ? (
                <RecordEmpty text={emptyText} />
            ) : (
                <ul className="border-y divide-y">
                    {items.map((item) => (
                        <li key={item.id} className="group flex items-center justify-between gap-4 py-3">
                            <div className="min-w-0">
                                <Link href={`/dashboard/objects/${item.id}`} className="text-sm font-medium hover:underline">
                                    {item.title}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                    {[item.artist_name, item.inventory_number].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="text-sm tabular-nums">
                                    {formatRecordCurrency(item.value, currency) || '—'}
                                </span>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => handleUnlink(item.id)}
                                        disabled={busyId === item.id}
                                        title="Remove object"
                                        className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add object</DialogTitle>
                        <DialogDescription>
                            Link an existing object to this record.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Object</Label>
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={loading ? 'Loading...' : 'Search objects...'}
                            />
                            <div className="max-h-56 overflow-y-auto rounded-md border">
                                {filtered.length === 0 ? (
                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                        {loading ? 'Loading...' : 'No objects found'}
                                    </p>
                                ) : (
                                    filtered.map((o) => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => setSelectedId(o.id)}
                                            className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted ${
                                                selectedId === o.id ? 'bg-muted' : ''
                                            }`}
                                        >
                                            <span className="font-medium">{o.title}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {[o.artist_name, o.inventory_number].filter(Boolean).join(' · ')}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>{valueLabel}</Label>
                            <Input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={saving || !selectedId}>
                            {saving ? 'Adding...' : 'Add'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </RecordSection>
    )
}
