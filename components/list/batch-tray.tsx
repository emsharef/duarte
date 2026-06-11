'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LocationPicker } from '@/components/location-picker'
import { useSelection } from '@/components/list/selection'
import {
    batchAddToList,
    batchDelete,
    batchSetLocation,
    batchSetStatus,
    createGroup,
} from '@/app/actions/views'
import {
    LIST_STATUSES,
    LIST_STATUS_LABELS,
    getListColumn,
    gridCellValue,
    type GridRow,
} from '@/lib/list-columns'

type BatchTrayProps = {
    rows: GridRow[]
    visibleKeys: string[]
    canEdit: boolean
    groups: { id: string; name: string }[]
}

function csvEscape(value: unknown): string {
    const s = value == null ? '' : String(value)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function BatchTray({ rows, visibleKeys, canEdit, groups }: BatchTrayProps) {
    const selection = useSelection()
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    const [locationOpen, setLocationOpen] = useState(false)
    const [locationId, setLocationId] = useState<string | undefined>(undefined)
    const [listOpen, setListOpen] = useState(false)
    const [groupId, setGroupId] = useState('')
    const [newListName, setNewListName] = useState('')
    const [deleteOpen, setDeleteOpen] = useState(false)

    if (selection.count === 0) return null

    const selectedRows = rows.filter((r) => r.id && selection.has(r.id))

    function run(action: () => Promise<void>, after?: () => void) {
        startTransition(async () => {
            try {
                await action()
                after?.()
                router.refresh()
            } catch (err) {
                console.error('Batch action failed:', err)
                window.alert(err instanceof Error ? err.message : 'Action failed')
            }
        })
    }

    function exportCsv() {
        const defs = visibleKeys
            .map((k) => getListColumn(k))
            .filter((d): d is NonNullable<typeof d> => !!d && d.type !== 'image')

        const header = defs.map((d) => csvEscape(d.label)).join(',')
        const lines = selectedRows.map((row) =>
            defs
                .map((d) => {
                    const value = gridCellValue(row, d)
                    if (d.type === 'status' && typeof value === 'string') {
                        return csvEscape(LIST_STATUS_LABELS[value] ?? value)
                    }
                    return csvEscape(value)
                })
                .join(',')
        )

        const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <>
            <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="gap-1.5 py-1">
                    {selection.count} selected
                    <button
                        type="button"
                        onClick={() => selection.clear()}
                        className="rounded-full hover:bg-muted-foreground/20"
                        aria-label="Clear selection"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9" disabled={pending}>
                            Actions
                            <ChevronDown className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && (
                            <>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Set status</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {LIST_STATUSES.map((s) => (
                                            <DropdownMenuItem
                                                key={s}
                                                onClick={() => run(() => batchSetStatus(selection.ids, s))}
                                            >
                                                {LIST_STATUS_LABELS[s] ?? s}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={() => setLocationOpen(true)}>
                                    Set location…
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setListOpen(true)}>
                                    Add to list…
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onClick={exportCsv}>Export CSV</DropdownMenuItem>
                        {canEdit && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    Delete…
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Set location */}
            <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set location</DialogTitle>
                        <DialogDescription>
                            Move {selection.count} object{selection.count === 1 ? '' : 's'} to a location.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Location</Label>
                        <LocationPicker value={locationId} onChange={setLocationId} className="w-full" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLocationOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={pending}
                            onClick={() =>
                                run(
                                    () => batchSetLocation(selection.ids, locationId ?? null),
                                    () => setLocationOpen(false)
                                )
                            }
                        >
                            {pending ? 'Applying…' : 'Apply'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add to list */}
            <Dialog open={listOpen} onOpenChange={setListOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add to list</DialogTitle>
                        <DialogDescription>
                            Add {selection.count} object{selection.count === 1 ? '' : 's'} to a list.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Existing list</Label>
                            <Select value={groupId} onValueChange={setGroupId} disabled={groups.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={groups.length ? 'Select a list…' : 'No lists yet'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((g) => (
                                        <SelectItem key={g.id} value={g.id}>
                                            {g.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-list-name">Or create a new list</Label>
                            <Input
                                id="new-list-name"
                                placeholder="New list name…"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setListOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={pending || (!groupId && !newListName.trim())}
                            onClick={() =>
                                run(
                                    async () => {
                                        let targetId = groupId
                                        if (newListName.trim()) {
                                            const group = await createGroup(newListName)
                                            targetId = group.id
                                        }
                                        if (targetId) await batchAddToList(selection.ids, targetId)
                                    },
                                    () => {
                                        setListOpen(false)
                                        setNewListName('')
                                        setGroupId('')
                                    }
                                )
                            }
                        >
                            {pending ? 'Adding…' : 'Add'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete objects</DialogTitle>
                        <DialogDescription>
                            Permanently delete {selection.count} object{selection.count === 1 ? '' : 's'}? This
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={pending}
                            onClick={() =>
                                run(
                                    () => batchDelete(selection.ids),
                                    () => {
                                        selection.clear()
                                        setDeleteOpen(false)
                                    }
                                )
                            }
                        >
                            {pending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
