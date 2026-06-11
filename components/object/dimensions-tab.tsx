'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    ObjectWithRelations, addObjectDimension, deleteObjectDimension, updateObjectDimension,
} from '@/app/dashboard/objects/actions'
import { EmptyState, SectionHeader, dimensionText, toastError } from './shared'

type DimDraft = { type: string; height: string; width: string; depth: string; unit: string }

const EMPTY_DRAFT: DimDraft = { type: 'dimensions', height: '', width: '', depth: '', unit: 'cm' }

function DimensionEditor({
    draft, onChange, onSave, onCancel, saving,
}: {
    draft: DimDraft
    onChange: (d: DimDraft) => void
    onSave: () => void
    onCancel: () => void
    saving: boolean
}) {
    return (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/40">
            <Input
                className="h-8 flex-1" placeholder="Type (e.g. unframed)"
                value={draft.type} onChange={(e) => onChange({ ...draft, type: e.target.value })}
            />
            {(['height', 'width', 'depth'] as const).map((dim) => (
                <Input
                    key={dim} type="number" className="h-8 w-20"
                    placeholder={dim[0].toUpperCase()}
                    value={draft[dim]}
                    onChange={(e) => onChange({ ...draft, [dim]: e.target.value })}
                />
            ))}
            <Select value={draft.unit} onValueChange={(unit) => onChange({ ...draft, unit })}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                </SelectContent>
            </Select>
            <Button size="icon" className="h-8 w-8" onClick={onSave} disabled={saving} title="Save">
                <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel} title="Cancel">
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function DimensionsTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const dimensions = object.object_dimensions || []
    const [editingId, setEditingId] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState<DimDraft>(EMPTY_DRAFT)
    const [saving, setSaving] = useState(false)

    function startAdd() {
        setEditingId(null)
        setDraft(EMPTY_DRAFT)
        setAdding(true)
    }

    function startEdit(d: NonNullable<ObjectWithRelations['object_dimensions']>[number]) {
        setAdding(false)
        setEditingId(d.id)
        setDraft({
            type: d.type || 'dimensions',
            height: d.height?.toString() || '',
            width: d.width?.toString() || '',
            depth: d.depth?.toString() || '',
            unit: d.unit || 'cm',
        })
    }

    async function save() {
        setSaving(true)
        try {
            if (editingId) {
                await updateObjectDimension(editingId, draft)
            } else {
                await addObjectDimension(object.id, draft)
            }
            setAdding(false)
            setEditingId(null)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to save dimension')
        } finally {
            setSaving(false)
        }
    }

    async function remove(id: string) {
        if (!confirm('Delete this dimension entry?')) return
        try {
            await deleteObjectDimension(id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to delete dimension')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Dimensions"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={startAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            <div className="space-y-2">
                {dimensions.length === 0 && !adding && <EmptyState text="No dimensions recorded." />}

                {dimensions.map((d) => (
                    editingId === d.id ? (
                        <DimensionEditor
                            key={d.id} draft={draft} onChange={setDraft} onSave={save}
                            onCancel={() => setEditingId(null)} saving={saving}
                        />
                    ) : (
                        <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="text-sm font-medium capitalize">{d.type || 'dimensions'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {dimensionText(d, { bothUnits: true }) || 'No measurements'}
                                </p>
                            </div>
                            {canEdit && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(d)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(d.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                ))}

                {adding && (
                    <DimensionEditor
                        draft={draft} onChange={setDraft} onSave={save}
                        onCancel={() => setAdding(false)} saving={saving}
                    />
                )}
            </div>
        </div>
    )
}
