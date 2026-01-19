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
import { getContacts } from '@/app/actions/contacts'
import { getInsurancePolicies } from '@/app/actions/insurance'
import { LOAN_DIRECTIONS, LOAN_STATUSES } from '@/lib/constants'

type LoanFormProps = {
    loan?: Loan
}

export function LoanForm({ loan }: LoanFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [contacts, setContacts] = useState<Array<{ id: string; display_name: string }>>([])
    const [policies, setPolicies] = useState<Array<{ id: string; policy_subject: string }>>([])
    const [direction, setDirection] = useState(loan?.loan_direction || 'out')

    useEffect(() => {
        getContacts().then((data) => {
            setContacts(data.map(c => ({
                id: c.id,
                display_name: c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name || 'Unknown'
            })))
        })
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
        const borrowerContactId = formData.get('borrower_contact_id') as string
        const lenderContactId = formData.get('lender_contact_id') as string
        const insurancePolicyId = formData.get('insurance_policy_id') as string
        const insuranceValueStr = formData.get('insurance_value') as string

        const data: Partial<Loan> = {
            loan_subject: formData.get('loan_subject') as string || undefined,
            loan_direction: formData.get('loan_direction') as string || undefined,
            borrower_contact_id: borrowerContactId && borrowerContactId !== 'none' ? borrowerContactId : undefined,
            lender_contact_id: lenderContactId && lenderContactId !== 'none' ? lenderContactId : undefined,
            exhibition_name: formData.get('exhibition_name') as string || undefined,
            venue: formData.get('venue') as string || undefined,
            loan_start_date: formData.get('loan_start_date') as string || undefined,
            loan_end_date: formData.get('loan_end_date') as string || undefined,
            actual_return_date: formData.get('actual_return_date') as string || undefined,
            insurance_value: insuranceValueStr ? parseFloat(insuranceValueStr) : undefined,
            insurance_policy_id: insurancePolicyId && insurancePolicyId !== 'none' ? insurancePolicyId : undefined,
            loan_status: formData.get('loan_status') as string || 'Pending',
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

            <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="loan_direction">Direction *</Label>
                    <Select
                        name="loan_direction"
                        defaultValue={loan?.loan_direction || 'out'}
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
                    <Label htmlFor="loan_status">Status</Label>
                    <Select name="loan_status" defaultValue={loan?.loan_status || 'Pending'}>
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
                        <Select name="borrower_contact_id" defaultValue={loan?.borrower_contact_id || 'none'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select borrower..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                        {contact.display_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="lender_contact_id" value="none" />
                    </div>
                ) : (
                    <div className="col-span-2">
                        <Label htmlFor="lender_contact_id">Lender</Label>
                        <Select name="lender_contact_id" defaultValue={loan?.lender_contact_id || 'none'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select lender..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                        {contact.display_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="borrower_contact_id" value="none" />
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
                    <Label htmlFor="loan_start_date">Start Date</Label>
                    <Input
                        id="loan_start_date"
                        name="loan_start_date"
                        type="date"
                        defaultValue={loan?.loan_start_date || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="loan_end_date">End Date</Label>
                    <Input
                        id="loan_end_date"
                        name="loan_end_date"
                        type="date"
                        defaultValue={loan?.loan_end_date || ''}
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
