'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Pencil, Plus, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ObjectWithRelations } from '@/app/dashboard/objects/actions'
import {
    createAcquisition, getAcquisitions, linkObjectToAcquisition, unlinkObjectFromAcquisition,
} from '@/app/actions/acquisitions'
import { LinkDialog } from './link-dialog'
import { EmptyState, SectionHeader, contactName, formatCurrency, formatDate, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['acquisitions']>[number]

export function AcquisitionTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.acquisitions || []
    const [addOpen, setAddOpen] = useState(false)
    const [editRow, setEditRow] = useState<Row | null>(null)
    const [subject, setSubject] = useState('')
    const [date, setDate] = useState('')
    const [price, setPrice] = useState('')
    const [lotNumber, setLotNumber] = useState('')
    const [saving, setSaving] = useState(false)

    function openAdd() {
        setSubject('')
        setDate('')
        setPrice('')
        setAddOpen(true)
    }

    async function handleAdd(mode: 'existing' | 'new', selectedId: string | null) {
        let acquisitionId = selectedId
        if (mode === 'new') {
            const acq = await createAcquisition({
                acquisition_subject: subject || null,
                acquisition_date: date || null,
            })
            acquisitionId = acq.id
        }
        if (!acquisitionId) throw new Error('No acquisition selected')
        await linkObjectToAcquisition(object.id, acquisitionId, price ? { id: object.id, price: Number(price) } : undefined)
        router.refresh()
    }

    async function handleEdit() {
        if (!editRow?.acquisition?.id) return
        setSaving(true)
        try {
            await linkObjectToAcquisition(object.id, editRow.acquisition.id, {
                id: object.id,
                price: price ? Number(price) : undefined,
                lot_number: lotNumber || undefined,
            }, true)
            setEditRow(null)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to update acquisition link')
        } finally {
            setSaving(false)
        }
    }

    async function handleUnlink(row: Row) {
        if (!row.acquisition?.id || !confirm('Unlink this acquisition from the object?')) return
        try {
            await unlinkObjectFromAcquisition(object.id, row.acquisition.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to unlink acquisition')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Acquisition"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? <EmptyState text="No acquisition recorded." /> : (
                <div className="space-y-2">
                    {rows.map((row, i) => (
                        <div key={row.acquisition?.id ?? i} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="text-sm space-y-0.5">
                                <p className="font-medium">{row.acquisition?.acquisition_subject || 'Acquisition'}</p>
                                <p className="text-muted-foreground">
                                    {formatDate(row.acquisition?.acquisition_date)}
                                    {row.acquisition?.acquired_from && ` · From ${contactName(row.acquisition.acquired_from)}`}
                                    {row.lot_number && ` · Lot ${row.lot_number}`}
                                </p>
                                <p className="text-muted-foreground">
                                    Object price: {formatCurrency(row.object_price, row.acquisition?.currency)}
                                    {row.acquisition?.total_cost != null &&
                                        ` · Acquisition total: ${formatCurrency(row.acquisition.total_cost, row.acquisition.currency)}`}
                                </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {canEdit && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit link"
                                            onClick={() => {
                                                setEditRow(row)
                                                setPrice(row.object_price?.toString() || '')
                                                setLotNumber(row.lot_number || '')
                                            }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Unlink"
                                            onClick={() => handleUnlink(row)}>
                                            <Unlink className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                {row.acquisition?.id && (
                                    <Link href={`/dashboard/acquisitions/${row.acquisition.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Open acquisition">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <LinkDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                title="Add acquisition"
                noun="acquisition"
                loadOptions={async () => (await getAcquisitions()).map((a) => ({
                    id: a.id,
                    label: `${a.acquisition_subject || 'Untitled'}${a.acquisition_date ? ` (${formatDate(a.acquisition_date)})` : ''}`,
                }))}
                createFields={(
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Auction purchase" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>
                )}
                valueFields={(
                    <div className="grid gap-2">
                        <Label>Object price</Label>
                        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                    </div>
                )}
                onSubmit={handleAdd}
            />

            <Dialog open={!!editRow} onOpenChange={(open) => { if (!open) setEditRow(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit acquisition link</DialogTitle>
                        <DialogDescription>
                            Update the price and lot details for this object on the acquisition.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Object price</Label>
                            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Lot number</Label>
                            <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
                        </div>
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
