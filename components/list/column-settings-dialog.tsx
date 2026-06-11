'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LIST_COLUMNS, PAGE_SIZE_OPTIONS, getListColumn } from '@/lib/list-columns'
import { cn } from '@/lib/utils'

type ColumnSettingsDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    visible: string[]
    pageSize: number
    canEdit: boolean
    onApply: (columns: string[], pageSize: number) => void
    onSaveView: (name: string, columns: string[], pageSize: number) => Promise<void>
}

function ColumnList({
    keys,
    selected,
    onSelect,
}: {
    keys: string[]
    selected: string | null
    onSelect: (key: string) => void
}) {
    return (
        <div className="h-60 overflow-y-auto rounded-md border p-1">
            {keys.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">None</p>
            )}
            {keys.map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(key)}
                    className={cn(
                        'block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                        selected === key && 'bg-accent font-medium'
                    )}
                >
                    {getListColumn(key)?.label ?? key}
                </button>
            ))}
        </div>
    )
}

export function ColumnSettingsDialog({
    open,
    onOpenChange,
    visible,
    pageSize,
    canEdit,
    onApply,
    onSaveView,
}: ColumnSettingsDialogProps) {
    const [displayed, setDisplayed] = useState<string[]>(visible)
    const [size, setSize] = useState(pageSize)
    const [selectedAvailable, setSelectedAvailable] = useState<string | null>(null)
    const [selectedDisplayed, setSelectedDisplayed] = useState<string | null>(null)
    const [viewName, setViewName] = useState('')
    const [saving, setSaving] = useState(false)

    // Re-sync local state each time the dialog opens
    useEffect(() => {
        if (open) {
            setDisplayed(visible)
            setSize(pageSize)
            setSelectedAvailable(null)
            setSelectedDisplayed(null)
            setViewName('')
        }
    }, [open, visible, pageSize])

    const available = LIST_COLUMNS.map((c) => c.key).filter((k) => !displayed.includes(k))

    function addColumn() {
        if (!selectedAvailable) return
        setDisplayed((prev) => [...prev, selectedAvailable])
        setSelectedAvailable(null)
    }

    function removeColumn() {
        if (!selectedDisplayed) return
        setDisplayed((prev) => prev.filter((k) => k !== selectedDisplayed))
        setSelectedDisplayed(null)
    }

    function move(delta: -1 | 1) {
        if (!selectedDisplayed) return
        setDisplayed((prev) => {
            const idx = prev.indexOf(selectedDisplayed)
            const next = idx + delta
            if (idx < 0 || next < 0 || next >= prev.length) return prev
            const copy = [...prev]
            copy[idx] = copy[next]
            copy[next] = selectedDisplayed
            return copy
        })
    }

    async function handleSaveView() {
        if (!viewName.trim() || displayed.length === 0) return
        setSaving(true)
        try {
            await onSaveView(viewName.trim(), displayed, size)
            setViewName('')
        } catch (err) {
            console.error('Failed to save view:', err)
            window.alert(err instanceof Error ? err.message : 'Failed to save view')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Customize columns</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="space-y-1.5">
                        <Label>Available</Label>
                        <ColumnList keys={available} selected={selectedAvailable} onSelect={setSelectedAvailable} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={addColumn} disabled={!selectedAvailable} aria-label="Add column">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={removeColumn} disabled={!selectedDisplayed} aria-label="Remove column">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => move(-1)} disabled={!selectedDisplayed} aria-label="Move up">
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => move(1)} disabled={!selectedDisplayed} aria-label="Move down">
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Displayed</Label>
                        <ColumnList keys={displayed} selected={selectedDisplayed} onSelect={setSelectedDisplayed} />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Label className="shrink-0">Items per page</Label>
                    <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {canEdit && (
                    <div className="flex items-end gap-2 border-t pt-4">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="view-name">Save as view</Label>
                            <Input
                                id="view-name"
                                placeholder="View name…"
                                value={viewName}
                                onChange={(e) => setViewName(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleSaveView}
                            disabled={saving || !viewName.trim() || displayed.length === 0}
                        >
                            {saving ? 'Saving…' : 'Save view'}
                        </Button>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onApply(displayed, size)
                            onOpenChange(false)
                        }}
                        disabled={displayed.length === 0}
                    >
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
