'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { List, Plus, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    ObjectWithRelations, addObjectToList, createList, getListsForSelection, removeObjectFromList,
} from '@/app/dashboard/objects/actions'
import { LinkDialog } from './link-dialog'
import { EmptyState, SectionHeader, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['lists']>[number]

export function ListsTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.lists || []
    const [addOpen, setAddOpen] = useState(false)
    const [listName, setListName] = useState('')

    function openAdd() {
        setListName('')
        setAddOpen(true)
    }

    async function handleAdd(mode: 'existing' | 'new', selectedId: string | null) {
        let groupId = selectedId
        if (mode === 'new') {
            if (!listName.trim()) throw new Error('Enter a list name')
            const list = await createList(listName.trim())
            groupId = list.id
        }
        if (!groupId) throw new Error('No list selected')
        await addObjectToList(object.id, groupId)
        router.refresh()
    }

    async function handleRemove(row: Row) {
        if (!row.group?.id || !confirm(`Remove this object from "${row.group.name}"?`)) return
        try {
            await removeObjectFromList(object.id, row.group.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to remove from list')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Lists"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? <EmptyState text="This object is not on any list." /> : (
                <div className="space-y-2">
                    {rows.map((row, i) => (
                        <div key={row.group?.id ?? i} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3 min-w-0">
                                <List className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{row.group?.name}</p>
                                    {row.group?.description && (
                                        <p className="text-sm text-muted-foreground truncate">{row.group.description}</p>
                                    )}
                                </div>
                            </div>
                            {canEdit && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 shrink-0" title="Remove from list"
                                    onClick={() => handleRemove(row)}>
                                    <Unlink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <LinkDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                title="Add to list"
                noun="list"
                loadOptions={async () => (await getListsForSelection()).map((l) => ({ id: l.id, label: l.name }))}
                createFields={(
                    <div className="grid gap-2">
                        <Label>List name</Label>
                        <Input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="e.g. 2026 exhibition shortlist" />
                    </div>
                )}
                onSubmit={handleAdd}
            />
        </div>
    )
}
