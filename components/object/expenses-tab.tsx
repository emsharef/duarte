'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { EXPENSE_TYPES } from '@/lib/constants'
import { ObjectWithRelations } from '@/app/dashboard/objects/actions'
import { createExpense, deleteExpense, updateExpense } from '@/app/actions/expenses'
import { EmptyState, SectionHeader, contactName, formatCurrency, formatDate, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['expenses']>[number]

export function ExpensesTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.expenses || []
    const [open, setOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [expenseType, setExpenseType] = useState('Other')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    function openAdd() {
        setEditingId(null)
        setExpenseType('Other')
        setAmount('')
        setDate('')
        setDescription('')
        setOpen(true)
    }

    function openEdit(row: Row) {
        setEditingId(row.id)
        setExpenseType(row.expense_type || 'Other')
        setAmount(row.amount?.toString() || '')
        setDate(row.expense_date || '')
        setDescription(row.description || '')
        setOpen(true)
    }

    async function save() {
        setSaving(true)
        try {
            const data = {
                expense_type: expenseType,
                amount: amount ? Number(amount) : undefined,
                expense_date: date || undefined,
                description: description || undefined,
            }
            if (editingId) {
                await updateExpense(editingId, data)
            } else {
                await createExpense({ ...data, object_id: object.id })
            }
            setOpen(false)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to save expense')
        } finally {
            setSaving(false)
        }
    }

    async function remove(row: Row) {
        if (!confirm('Delete this expense?')) return
        try {
            await deleteExpense(row.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to delete expense')
        }
    }

    const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0)

    return (
        <div>
            <SectionHeader
                title={`Expenses${rows.length > 0 ? ` · Total ${formatCurrency(total, rows[0]?.currency || 'USD')}` : ''}`}
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? <EmptyState text="No expenses recorded." /> : (
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div key={row.id} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="text-sm space-y-0.5">
                                <p className="font-medium">{row.expense_type || 'Expense'}</p>
                                <p className="text-muted-foreground">
                                    {formatDate(row.expense_date)}
                                    {row.vendor && ` · ${contactName(row.vendor)}`}
                                    {row.description && ` · ${row.description}`}
                                </p>
                                <p className="font-medium">{formatCurrency(row.amount, row.currency)}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {canEdit && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit"
                                            onClick={() => openEdit(row)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Delete"
                                            onClick={() => remove(row)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                <Link href="/dashboard/expenses">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Open expenses">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit expense' : 'Add expense'}</DialogTitle>
                        <DialogDescription>
                            Record the type, amount and date for this expense.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={expenseType} onValueChange={setExpenseType}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Amount</Label>
                                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
