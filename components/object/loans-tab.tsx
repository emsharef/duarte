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
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    ObjectWithRelations, linkObjectToLoan, unlinkObjectFromLoan, updateObjectLoan,
} from '@/app/dashboard/objects/actions'
import { createLoan, getLoans } from '@/app/actions/loans'
import { LinkDialog } from './link-dialog'
import { EmptyState, SectionHeader, contactName, formatCurrency, formatDate, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['loans']>[number]

export function LoansTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.loans || []
    const [addOpen, setAddOpen] = useState(false)
    const [editRow, setEditRow] = useState<Row | null>(null)
    const [subject, setSubject] = useState('')
    const [direction, setDirection] = useState('out')
    const [loanValue, setLoanValue] = useState('')
    const [saving, setSaving] = useState(false)

    function openAdd() {
        setSubject('')
        setDirection('out')
        setLoanValue('')
        setAddOpen(true)
    }

    async function handleAdd(mode: 'existing' | 'new', selectedId: string | null) {
        let loanId = selectedId
        if (mode === 'new') {
            const loan = await createLoan({ loan_subject: subject || null, direction })
            loanId = loan.id
        }
        if (!loanId) throw new Error('No loan selected')
        await linkObjectToLoan(object.id, loanId, loanValue ? Number(loanValue) : undefined)
        router.refresh()
    }

    async function handleEdit() {
        if (!editRow?.loan?.id) return
        setSaving(true)
        try {
            await updateObjectLoan(object.id, editRow.loan.id, loanValue ? Number(loanValue) : undefined)
            setEditRow(null)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to update loan link')
        } finally {
            setSaving(false)
        }
    }

    async function handleUnlink(row: Row) {
        if (!row.loan?.id || !confirm('Unlink this loan from the object?')) return
        try {
            await unlinkObjectFromLoan(object.id, row.loan.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to unlink loan')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Loans"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? <EmptyState text="No loans recorded." /> : (
                <div className="space-y-2">
                    {rows.map((row, i) => (
                        <div key={row.loan?.id ?? i} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="text-sm space-y-0.5">
                                <p className="font-medium">
                                    {row.loan?.direction === 'out' ? 'Loaned to' : 'Borrowed from'}{' '}
                                    {contactName(row.loan?.direction === 'out' ? row.loan?.borrower : row.loan?.lender)}
                                </p>
                                <p className="text-muted-foreground">
                                    {formatDate(row.loan?.start_date)} – {formatDate(row.loan?.end_date)}
                                    {row.loan_value != null && ` · Value: ${formatCurrency(row.loan_value)}`}
                                </p>
                                {row.loan?.status && (
                                    <Badge variant={row.loan.status === 'Active' ? 'default' : 'secondary'}>
                                        {row.loan.status}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {canEdit && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit loan value"
                                            onClick={() => {
                                                setEditRow(row)
                                                setLoanValue(row.loan_value?.toString() || '')
                                            }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Unlink"
                                            onClick={() => handleUnlink(row)}>
                                            <Unlink className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                {row.loan?.id && (
                                    <Link href={`/dashboard/loans/${row.loan.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Open loan">
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
                title="Add loan"
                noun="loan"
                loadOptions={async () => (await getLoans()).map((l) => ({
                    id: l.id,
                    label: `${l.loan_subject || l.exhibition_name || 'Untitled loan'}${l.start_date ? ` (${formatDate(l.start_date)})` : ''}`,
                }))}
                createFields={(
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Museum exhibition loan" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Direction</Label>
                            <Select value={direction} onValueChange={setDirection}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="out">Out (lending)</SelectItem>
                                    <SelectItem value="in">In (borrowing)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                valueFields={(
                    <div className="grid gap-2">
                        <Label>Loan value</Label>
                        <Input type="number" value={loanValue} onChange={(e) => setLoanValue(e.target.value)} placeholder="0.00" />
                    </div>
                )}
                onSubmit={handleAdd}
            />

            <Dialog open={!!editRow} onOpenChange={(open) => { if (!open) setEditRow(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit loan value</DialogTitle>
                        <DialogDescription>
                            Update the declared value for this object on the loan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label>Loan value</Label>
                        <Input type="number" value={loanValue} onChange={(e) => setLoanValue(e.target.value)} />
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
