'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Pencil, Plus, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ObjectWithRelations } from '@/app/dashboard/objects/actions'
import {
    addObjectToValuation, createValuation, getValuations,
    removeObjectFromValuation, updateObjectValuation,
} from '@/app/actions/valuations'
import { LinkDialog } from './link-dialog'
import { EmptyState, SectionHeader, contactName, formatCurrency, formatDate, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['valuations']>[number]

export function ValuationsTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.valuations || []
    const [addOpen, setAddOpen] = useState(false)
    const [editRow, setEditRow] = useState<Row | null>(null)
    const [subject, setSubject] = useState('')
    const [date, setDate] = useState('')
    const [appraisedValue, setAppraisedValue] = useState('')
    const [saving, setSaving] = useState(false)

    function openAdd() {
        setSubject('')
        setDate('')
        setAppraisedValue('')
        setAddOpen(true)
    }

    async function handleAdd(mode: 'existing' | 'new', selectedId: string | null) {
        let valuationId = selectedId
        if (mode === 'new') {
            const valuation = await createValuation({
                valuation_subject: subject || undefined,
                valuation_date: date || undefined,
            })
            valuationId = valuation.id
        }
        if (!valuationId) throw new Error('No valuation selected')
        await addObjectToValuation(valuationId, object.id, {
            appraised_value: appraisedValue ? Number(appraisedValue) : undefined,
        })
        router.refresh()
    }

    async function handleEdit() {
        if (!editRow) return
        setSaving(true)
        try {
            await updateObjectValuation(editRow.id, {
                appraised_value: appraisedValue ? Number(appraisedValue) : undefined,
            })
            setEditRow(null)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to update valuation')
        } finally {
            setSaving(false)
        }
    }

    async function handleUnlink(row: Row) {
        if (!confirm('Remove this object from the valuation?')) return
        try {
            await removeObjectFromValuation(row.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to remove valuation')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Valuations"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? <EmptyState text="No valuations recorded." /> : (
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div key={row.id} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="text-sm space-y-0.5">
                                <p className="font-medium">
                                    {formatCurrency(row.appraised_value, row.valuation?.currency)}
                                </p>
                                <p className="text-muted-foreground">
                                    {formatDate(row.valuation?.valuation_date)}
                                    {row.valuation?.appraiser && ` · ${contactName(row.valuation.appraiser)}`}
                                </p>
                                {row.valuation?.value_type && (
                                    <Badge variant="outline">{row.valuation.value_type}</Badge>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {canEdit && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit value"
                                            onClick={() => {
                                                setEditRow(row)
                                                setAppraisedValue(row.appraised_value?.toString() || '')
                                            }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Unlink"
                                            onClick={() => handleUnlink(row)}>
                                            <Unlink className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                <Link href="/dashboard/valuations">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Open valuations">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <LinkDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                title="Add valuation"
                noun="valuation"
                loadOptions={async () => (await getValuations()).map((v) => ({
                    id: v.id,
                    label: `${v.valuation_subject || 'Untitled'}${v.valuation_date ? ` (${formatDate(v.valuation_date)})` : ''}`,
                }))}
                createFields={(
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. 2026 insurance appraisal" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>
                )}
                valueFields={(
                    <div className="grid gap-2">
                        <Label>Appraised value</Label>
                        <Input type="number" value={appraisedValue} onChange={(e) => setAppraisedValue(e.target.value)} placeholder="0.00" />
                    </div>
                )}
                onSubmit={handleAdd}
            />

            <Dialog open={!!editRow} onOpenChange={(open) => { if (!open) setEditRow(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit appraised value</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label>Appraised value</Label>
                        <Input type="number" value={appraisedValue} onChange={(e) => setAppraisedValue(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
