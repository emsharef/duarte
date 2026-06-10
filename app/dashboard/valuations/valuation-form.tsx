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
import { createValuation, updateValuation, deleteValuation, Valuation } from '@/app/actions/valuations'
import { ContactPicker } from '@/components/contact-picker'
import { VALUE_TYPES, VALUATION_STATUSES } from '@/lib/constants'

type ValuationFormProps = {
    valuation?: Valuation
}

export function ValuationForm({ valuation }: ValuationFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [appraiserContactId, setAppraiserContactId] = useState<string | undefined>(valuation?.appraiser_contact_id)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data: Partial<Valuation> = {
            valuation_subject: formData.get('valuation_subject') as string || undefined,
            valuation_date: formData.get('valuation_date') as string || undefined,
            valuation_status: formData.get('valuation_status') as string || 'Pending',
            appraiser_contact_id: appraiserContactId || undefined,
            value_type: formData.get('value_type') as string || undefined,
            total_value: formData.get('total_value') ? parseFloat(formData.get('total_value') as string) : undefined,
            currency: formData.get('currency') as string || 'USD',
            notes: formData.get('notes') as string || undefined,
        }

        try {
            if (valuation) {
                await updateValuation(valuation.id, data)
            } else {
                await createValuation(data)
            }
            router.push('/dashboard/valuations')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!valuation) return
        if (!confirm('Are you sure you want to delete this valuation?')) return

        setLoading(true)
        try {
            await deleteValuation(valuation.id)
            router.push('/dashboard/valuations')
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

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label htmlFor="valuation_subject">Subject / Title</Label>
                    <Input
                        id="valuation_subject"
                        name="valuation_subject"
                        defaultValue={valuation?.valuation_subject || ''}
                        placeholder="e.g., 2024 Insurance Appraisal"
                    />
                </div>

                <div>
                    <Label htmlFor="value_type">Valuation Type</Label>
                    <Select name="value_type" defaultValue={valuation?.value_type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {VALUE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="valuation_status">Status</Label>
                    <Select name="valuation_status" defaultValue={valuation?.valuation_status || 'Pending'}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {VALUATION_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="valuation_date">Valuation Date</Label>
                    <Input
                        id="valuation_date"
                        name="valuation_date"
                        type="date"
                        defaultValue={valuation?.valuation_date || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="appraiser_contact_id">Appraiser</Label>
                    <ContactPicker
                        value={appraiserContactId}
                        onChange={setAppraiserContactId}
                        placeholder="Select appraiser..."
                        suggestedType="Appraiser"
                        className="w-full"
                    />
                </div>

                <div>
                    <Label htmlFor="total_value">Total Value</Label>
                    <Input
                        id="total_value"
                        name="total_value"
                        type="number"
                        step="0.01"
                        defaultValue={valuation?.total_value || ''}
                        placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Auto-calculated when adding objects
                    </p>
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue={valuation?.currency || 'USD'}>
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
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        defaultValue={valuation?.notes || ''}
                        placeholder="Additional details about this valuation..."
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {valuation && (
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
                        {loading ? 'Saving...' : (valuation ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
