'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toastError } from './shared'

export type LinkOption = { id: string; label: string }

type LinkDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    noun: string
    loadOptions: () => Promise<LinkOption[]>
    // Fields rendered only in "create new" mode (controlled by the parent tab)
    createFields?: React.ReactNode
    // Fields rendered in both modes (per-object link values)
    valueFields?: React.ReactNode
    onSubmit: (mode: 'existing' | 'new', selectedId: string | null) => Promise<void>
}

// Dialog shared by the related-record tabs: pick an existing module record or
// quick-create a minimal one, plus per-object value fields. Saving calls the
// existing module server actions via onSubmit.
export function LinkDialog({
    open, onOpenChange, title, noun, loadOptions, createFields, valueFields, onSubmit,
}: LinkDialogProps) {
    const [mode, setMode] = useState<'existing' | 'new'>('existing')
    const [options, setOptions] = useState<LinkOption[]>([])
    const [selectedId, setSelectedId] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setMode('existing')
        setSelectedId('')
        setLoading(true)
        loadOptions()
            .then((opts) => {
                setOptions(opts)
                if (opts.length === 0) setMode('new')
            })
            .catch(() => setOptions([]))
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    async function handleSubmit() {
        if (mode === 'existing' && !selectedId) {
            toastError(`Select a ${noun} to link`)
            return
        }
        setSaving(true)
        try {
            await onSubmit(mode, mode === 'existing' ? selectedId : null)
            onOpenChange(false)
        } catch (err) {
            toastError(err instanceof Error ? err.message : `Failed to save ${noun}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Link an existing {noun} to this object, or create a new one.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex rounded-lg border p-0.5">
                        {(['existing', 'new'] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={cn(
                                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium',
                                    mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                                )}
                            >
                                {m === 'existing' ? `Link existing ${noun}` : `Create new ${noun}`}
                            </button>
                        ))}
                    </div>

                    {mode === 'existing' ? (
                        <div className="grid gap-2">
                            <Label>{noun.charAt(0).toUpperCase() + noun.slice(1)}</Label>
                            <Select value={selectedId || undefined} onValueChange={setSelectedId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loading ? 'Loading...' : `Select ${noun}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((o) => (
                                        <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                                    ))}
                                    {!loading && options.length === 0 && (
                                        <p className="px-3 py-2 text-sm text-muted-foreground">No {noun}s yet</p>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : createFields}

                    {valueFields}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
