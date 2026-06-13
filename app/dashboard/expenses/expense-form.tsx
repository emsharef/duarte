'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createExpense, updateExpense, deleteExpense, Expense } from '@/app/actions/expenses'
import { ContactPicker } from '@/components/contact-picker'
import { EXPENSE_TYPES } from '@/lib/constants'

type ExpenseFormProps = {
    expense?: Expense
    objectId?: string
}

export function ExpenseForm({ expense, objectId }: ExpenseFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [vendorContactId, setVendorContactId] = useState<string | undefined>(expense?.vendor_contact_id)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data: Partial<Expense> = {
            object_id: formData.get('object_id') as string || objectId || undefined,
            expense_type: formData.get('expense_type') as string || undefined,
            expense_date: formData.get('expense_date') as string || undefined,
            vendor_contact_id: vendorContactId || undefined,
            amount: formData.get('amount') ? parseFloat(formData.get('amount') as string) : undefined,
            currency: formData.get('currency') as string || 'USD',
            description: formData.get('description') as string || undefined,
            invoice_number: formData.get('invoice_number') as string || undefined,
        }

        try {
            if (expense) {
                await updateExpense(expense.id, data)
                router.push(`/dashboard/expenses/${expense.id}`)
            } else {
                await createExpense(data)
                router.push('/dashboard/expenses')
            }
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!expense) return
        if (!confirm('Are you sure you want to delete this expense?')) return

        setLoading(true)
        try {
            await deleteExpense(expense.id)
            router.push('/dashboard/expenses')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="expense_type">Expense Type</Label>
                    <Select name="expense_type" defaultValue={expense?.expense_type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {EXPENSE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="expense_date">Date</Label>
                    <Input
                        id="expense_date"
                        name="expense_date"
                        type="date"
                        defaultValue={expense?.expense_date || new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={expense?.amount || ''}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue={expense?.currency || 'USD'}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2">
                    <Label htmlFor="vendor_contact_id">Vendor</Label>
                    <ContactPicker
                        value={vendorContactId}
                        onChange={setVendorContactId}
                        placeholder="Select vendor..."
                        suggestedType="Vendor"
                        className="w-full"
                    />
                </div>

                <div>
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                        id="invoice_number"
                        name="invoice_number"
                        defaultValue={expense?.invoice_number || ''}
                        placeholder="INV-001"
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={expense?.description || ''}
                        placeholder="Details about the expense..."
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {expense && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Delete
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : (expense ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
