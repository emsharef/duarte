'use client'

import { useState, useEffect } from 'react'
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
import { createLoan, updateLoan, deleteLoan, Loan } from '@/app/actions/loans'
import { getInsurancePolicies } from '@/app/actions/insurance'
import { ContactPicker } from '@/components/contact-picker'
import { LOAN_DIRECTIONS, LOAN_STATUSES } from '@/lib/constants'

type LoanFormProps = {
    loan?: Loan
}

export function LoanForm({ loan }: LoanFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [policies, setPolicies] = useState<Array<{ id: string; policy_subject: string }>>([])
    const [direction, setDirection] = useState(loan?.direction || 'out')
    const [borrowerContactId, setBorrowerContactId] = useState<string | undefined>(loan?.borrower_contact_id ?? undefined)
    const [lenderContactId, setLenderContactId] = useState<string | undefined>(loan?.lender_contact_id ?? undefined)

    useEffect(() => {
        getInsurancePolicies().then((data) => {
            setPolicies(data.map(p => ({
                id: p.id,
                policy_subject: p.policy_subject || p.policy_number || 'Unnamed Policy'
            })))
        })
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const insurancePolicyId = formData.get('insurance_policy_id') as string
        const insuranceValueStr = formData.get('insurance_value') as string

        const data: Partial<Loan> = {
            loan_subject: formData.get('loan_subject') as string || undefined,
            direction: formData.get('direction') as string || undefined,
            borrower_contact_id: borrowerContactId || undefined,
            lender_contact_id: lenderContactId || undefined,
            exhibition_name: formData.get('exhibition_name') as string || undefined,
            venue: formData.get('venue') as string || undefined,
            start_date: formData.get('start_date') as string || undefined,
            end_date: formData.get('end_date') as string || undefined,
            actual_return_date: formData.get('actual_return_date') as string || undefined,
            insurance_value: insuranceValueStr ? parseFloat(insuranceValueStr) : undefined,
            insurance_policy_id: insurancePolicyId && insurancePolicyId !== 'none' ? insurancePolicyId : undefined,
            status: formData.get('status') as string || 'Pending',
            currency: formData.get('currency') as string || 'USD',
            notes: formData.get('notes') as string || undefined,
        }

        try {
            if (loan) {
                await updateLoan(loan.id, data)
            } else {
                await createLoan(data)
            }
            router.push('/dashboard/loans')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!loan) return
        if (!confirm('Are you sure you want to delete this loan?')) return

        setLoading(true)
        try {
            await deleteLoan(loan.id)
            router.push('/dashboard/loans')
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
                <div className="col-span-2">
                    <Label htmlFor="loan_subject">Loan Subject</Label>
                    <Input
                        id="loan_subject"
                        name="loan_subject"
                        defaultValue={loan?.loan_subject || ''}
                        placeholder="e.g., Museum Exhibition 2024"
                    />
                </div>

                <div>
                    <Label htmlFor="direction">Direction *</Label>
                    <Select
                        name="direction"
                        defaultValue={loan?.direction || 'out'}
                        onValueChange={(value) => setDirection(value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select direction..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="out">Loan Out (lending to someone)</SelectItem>
                            <SelectItem value="in">Loan In (borrowing from someone)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={loan?.status || 'Pending'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                            {LOAN_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {direction === 'out' ? (
                    <div className="col-span-2">
                        <Label htmlFor="borrower_contact_id">Borrower</Label>
                        <ContactPicker
                            value={borrowerContactId}
                            onChange={setBorrowerContactId}
                            placeholder="Select borrower..."
                            suggestedType="Museum"
                            className="w-full"
                        />
                    </div>
                ) : (
                    <div className="col-span-2">
                        <Label htmlFor="lender_contact_id">Lender</Label>
                        <ContactPicker
                            value={lenderContactId}
                            onChange={setLenderContactId}
                            placeholder="Select lender..."
                            suggestedType="Collector"
                            className="w-full"
                        />
                    </div>
                )}

                <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="font-medium mb-3">Exhibition Details (optional)</h3>
                </div>

                <div>
                    <Label htmlFor="exhibition_name">Exhibition Name</Label>
                    <Input
                        id="exhibition_name"
                        name="exhibition_name"
                        defaultValue={loan?.exhibition_name || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                        id="venue"
                        name="venue"
                        defaultValue={loan?.venue || ''}
                    />
                </div>

                <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="font-medium mb-3">Dates</h3>
                </div>

                <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        defaultValue={loan?.start_date || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        defaultValue={loan?.end_date || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="actual_return_date">Actual Return Date</Label>
                    <Input
                        id="actual_return_date"
                        name="actual_return_date"
                        type="date"
                        defaultValue={loan?.actual_return_date || ''}
                    />
                </div>

                <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="font-medium mb-3">Insurance</h3>
                </div>

                <div>
                    <Label htmlFor="insurance_value">Insurance Value</Label>
                    <Input
                        id="insurance_value"
                        name="insurance_value"
                        type="number"
                        step="0.01"
                        defaultValue={loan?.insurance_value || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                        id="currency"
                        name="currency"
                        defaultValue={loan?.currency || 'USD'}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="insurance_policy_id">Insurance Policy</Label>
                    <Select name="insurance_policy_id" defaultValue={loan?.insurance_policy_id || 'none'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select policy..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {policies.map((policy) => (
                                <SelectItem key={policy.id} value={policy.id}>
                                    {policy.policy_subject}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 border-t pt-4 mt-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        defaultValue={loan?.notes || ''}
                        placeholder="Additional details about this loan..."
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {loan && (
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
                        {loading ? 'Saving...' : (loan ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
