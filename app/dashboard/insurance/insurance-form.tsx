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
import { createInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy, InsurancePolicy } from '@/app/actions/insurance'
import { ContactPicker } from '@/components/contact-picker'
import { COVERAGE_TYPES } from '@/lib/constants'

type InsuranceFormProps = {
    policy?: InsurancePolicy
}

export function InsuranceForm({ policy }: InsuranceFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isActive, setIsActive] = useState(policy?.is_active ?? true)
    const [insurerContactId, setInsurerContactId] = useState<string | undefined>(policy?.insurer_contact_id)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data: Partial<InsurancePolicy> = {
            policy_subject: formData.get('policy_subject') as string || undefined,
            policy_number: formData.get('policy_number') as string || undefined,
            insurer_contact_id: insurerContactId || undefined,
            start_date: formData.get('start_date') as string || undefined,
            end_date: formData.get('end_date') as string || undefined,
            coverage_type: formData.get('coverage_type') as string || undefined,
            total_coverage: formData.get('total_coverage') ? parseFloat(formData.get('total_coverage') as string) : undefined,
            deductible: formData.get('deductible') ? parseFloat(formData.get('deductible') as string) : undefined,
            premium: formData.get('premium') ? parseFloat(formData.get('premium') as string) : undefined,
            currency: formData.get('currency') as string || 'USD',
            notes: formData.get('notes') as string || undefined,
            is_active: isActive,
        }

        try {
            if (policy) {
                await updateInsurancePolicy(policy.id, data)
                router.push(`/dashboard/insurance/${policy.id}`)
            } else {
                await createInsurancePolicy(data)
                router.push('/dashboard/insurance')
            }
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!policy) return
        if (!confirm('Are you sure you want to delete this policy?')) return

        setLoading(true)
        try {
            await deleteInsurancePolicy(policy.id)
            router.push('/dashboard/insurance')
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
                    <Label htmlFor="policy_subject">Policy Name / Subject</Label>
                    <Input
                        id="policy_subject"
                        name="policy_subject"
                        defaultValue={policy?.policy_subject || ''}
                        placeholder="e.g., Main Collection Policy 2024"
                    />
                </div>

                <div>
                    <Label htmlFor="policy_number">Policy Number</Label>
                    <Input
                        id="policy_number"
                        name="policy_number"
                        defaultValue={policy?.policy_number || ''}
                        placeholder="POL-12345"
                    />
                </div>

                <div>
                    <Label htmlFor="coverage_type">Coverage Type</Label>
                    <Select name="coverage_type" defaultValue={policy?.coverage_type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {COVERAGE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2">
                    <Label htmlFor="insurer_contact_id">Insurance Company</Label>
                    <ContactPicker
                        value={insurerContactId}
                        onChange={setInsurerContactId}
                        placeholder="Select insurer..."
                        suggestedType="Insurance Company"
                        className="w-full"
                    />
                </div>

                <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        defaultValue={policy?.start_date || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        defaultValue={policy?.end_date || ''}
                    />
                </div>

                <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="font-medium mb-3">Financial Details</h3>
                </div>

                <div>
                    <Label htmlFor="total_coverage">Total Coverage</Label>
                    <Input
                        id="total_coverage"
                        name="total_coverage"
                        type="number"
                        step="0.01"
                        defaultValue={policy?.total_coverage || ''}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue={policy?.currency || 'USD'}>
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

                <div>
                    <Label htmlFor="deductible">Deductible</Label>
                    <Input
                        id="deductible"
                        name="deductible"
                        type="number"
                        step="0.01"
                        defaultValue={policy?.deductible || ''}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <Label htmlFor="premium">Annual Premium</Label>
                    <Input
                        id="premium"
                        name="premium"
                        type="number"
                        step="0.01"
                        defaultValue={policy?.premium || ''}
                        placeholder="0.00"
                    />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                        Policy is active
                    </Label>
                </div>

                <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        defaultValue={policy?.notes || ''}
                        placeholder="Additional details about this policy..."
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {policy && (
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
                        {loading ? 'Saving...' : (policy ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
