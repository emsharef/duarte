'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { createAcquisition, updateAcquisition, deleteAcquisition, linkObjectToAcquisition, unlinkObjectFromAcquisition, Acquisition } from '@/app/actions/acquisitions'
import { getContacts } from '@/app/actions/contacts'
import { getObject } from '@/app/dashboard/objects/actions'
import { ObjectPicker, SelectedObject } from '@/components/object-picker'
import { ACQUISITION_TYPES } from '@/lib/constants'

type AcquisitionFormProps = {
    acquisition?: Acquisition
    initialObjects?: SelectedObject[]
}

export function AcquisitionForm({ acquisition, initialObjects = [] }: AcquisitionFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [contacts, setContacts] = useState<Array<{ id: string; display_name: string }>>([])
    const [selectedObjects, setSelectedObjects] = useState<SelectedObject[]>(initialObjects)
    const [currency, setCurrency] = useState(acquisition?.currency || 'USD')
    const [exchangeRate, setExchangeRate] = useState<string>(acquisition?.exchange_rate?.toString() || '')

    useEffect(() => {
        getContacts().then(setContacts)

        // Handle ?object= query param to pre-select an object
        const objectId = searchParams.get('object')
        if (objectId && !acquisition && initialObjects.length === 0) {
            getObject(objectId).then(obj => {
                if (obj) {
                    setSelectedObjects([{
                        id: obj.id,
                        title: obj.title,
                        artist_name: obj.artists
                            ? `${obj.artists.first_name || ''} ${obj.artists.last_name || ''}`.trim()
                            : undefined
                    }])
                }
            })
        }
    }, [searchParams, acquisition, initialObjects.length])

    // Calculate totals from objects
    const calculateObjectTotal = (obj: SelectedObject): number => {
        const price = obj.price || 0
        const discount = obj.discount || 0
        const premium = obj.buyer_premium || 0
        const taxes = obj.taxes || 0
        return price - discount + premium + taxes
    }

    const subtotal = selectedObjects.reduce((sum, obj) => sum + (obj.price || 0), 0)
    const totalDiscount = selectedObjects.reduce((sum, obj) => sum + (obj.discount || 0), 0)
    const totalPremium = selectedObjects.reduce((sum, obj) => sum + (obj.buyer_premium || 0), 0)
    const totalTaxes = selectedObjects.reduce((sum, obj) => sum + (obj.taxes || 0), 0)
    const grandTotal = selectedObjects.reduce((sum, obj) => sum + calculateObjectTotal(obj), 0)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    }

    // Calculate USD equivalent if exchange rate is provided
    const usdEquivalent = exchangeRate && currency !== 'USD'
        ? grandTotal * parseFloat(exchangeRate)
        : null

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        const data: Partial<Acquisition> = {
            acquisition_subject: formData.get('acquisition_subject') as string || undefined,
            acquisition_date: formData.get('acquisition_date') as string || undefined,
            acquired_from_contact_id: formData.get('acquired_from_contact_id') as string || undefined,
            acquisition_type: formData.get('acquisition_type') as string || undefined,
            bought_by_contact_id: formData.get('bought_by_contact_id') as string || undefined,
            currency,
            exchange_rate: exchangeRate ? parseFloat(exchangeRate) : undefined,
            // Store calculated totals for backwards compatibility / reporting
            acquisition_price: subtotal || undefined,
            acquisition_discount: totalDiscount || undefined,
            buyer_premium: totalPremium || undefined,
            taxes: totalTaxes || undefined,
            total_cost: grandTotal || undefined,
            invoice_number: formData.get('invoice_number') as string || undefined,
            invoice_date: formData.get('invoice_date') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        }

        try {
            if (acquisition) {
                await updateAcquisition(acquisition.id, data)

                // Handle object linking changes
                const initialIds = new Set(initialObjects.map(o => o.id))
                const currentIds = new Set(selectedObjects.map(o => o.id))

                // Unlink removed objects
                for (const obj of initialObjects) {
                    if (!currentIds.has(obj.id)) {
                        await unlinkObjectFromAcquisition(obj.id, acquisition.id)
                    }
                }

                // Link new objects or update existing
                for (const obj of selectedObjects) {
                    if (!initialIds.has(obj.id)) {
                        // New object
                        await linkObjectToAcquisition(obj.id, acquisition.id, obj)
                    } else {
                        // Existing object - update its data
                        await linkObjectToAcquisition(obj.id, acquisition.id, obj, true)
                    }
                }
            } else {
                const newAcquisition = await createAcquisition(data)
                // Link selected objects to the new acquisition
                for (const obj of selectedObjects) {
                    await linkObjectToAcquisition(obj.id, newAcquisition.id, obj)
                }
            }
            router.push('/dashboard/acquisitions')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!acquisition) return
        if (!confirm('Are you sure you want to delete this acquisition?')) return

        setLoading(true)
        try {
            await deleteAcquisition(acquisition.id)
            router.push('/dashboard/acquisitions')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label htmlFor="acquisition_subject">Subject / Title</Label>
                    <Input
                        id="acquisition_subject"
                        name="acquisition_subject"
                        defaultValue={acquisition?.acquisition_subject || ''}
                        placeholder="e.g., Fall 2024 Auction Purchase"
                    />
                </div>

                <div>
                    <Label htmlFor="acquisition_type">Type</Label>
                    <Select name="acquisition_type" defaultValue={acquisition?.acquisition_type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {ACQUISITION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="acquisition_date">Date</Label>
                    <Input
                        id="acquisition_date"
                        name="acquisition_date"
                        type="date"
                        defaultValue={acquisition?.acquisition_date || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="acquired_from_contact_id">Acquired From</Label>
                    <Select name="acquired_from_contact_id" defaultValue={acquisition?.acquired_from_contact_id || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select contact..." />
                        </SelectTrigger>
                        <SelectContent>
                            {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                    {contact.display_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="bought_by_contact_id">Bought By</Label>
                    <Select name="bought_by_contact_id" defaultValue={acquisition?.bought_by_contact_id || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select buyer..." />
                        </SelectTrigger>
                        <SelectContent>
                            {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                    {contact.display_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CHF">CHF</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                            <SelectItem value="CNY">CNY</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {currency !== 'USD' && (
                    <div>
                        <Label htmlFor="exchange_rate">Exchange Rate (to USD)</Label>
                        <Input
                            id="exchange_rate"
                            type="number"
                            step="0.0001"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                            placeholder="e.g., 1.08"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            1 {currency} = ? USD
                        </p>
                    </div>
                )}

                <div>
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                        id="invoice_number"
                        name="invoice_number"
                        defaultValue={acquisition?.invoice_number || ''}
                        placeholder="INV-001"
                    />
                </div>

                <div>
                    <Label htmlFor="invoice_date">Invoice Date</Label>
                    <Input
                        id="invoice_date"
                        name="invoice_date"
                        type="date"
                        defaultValue={acquisition?.invoice_date || ''}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        defaultValue={acquisition?.notes || ''}
                        placeholder="Additional details about this acquisition..."
                    />
                </div>

                {/* Object Selection with Financial Fields */}
                <div className="col-span-2 border-t pt-4 mt-2">
                    <ObjectPicker
                        selectedObjects={selectedObjects}
                        onSelectionChange={setSelectedObjects}
                        showFinancialFields={true}
                        currency={currency}
                        label="Objects in this Acquisition"
                    />
                </div>

                {/* Totals Summary */}
                {selectedObjects.length > 0 && (
                    <div className="col-span-2 border-t pt-4 mt-2">
                        <h3 className="font-medium mb-3">Acquisition Summary</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal ({selectedObjects.length} object{selectedObjects.length !== 1 ? 's' : ''})</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discounts</span>
                                    <span>-{formatCurrency(totalDiscount)}</span>
                                </div>
                            )}
                            {totalPremium > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Buyer Premiums</span>
                                    <span>+{formatCurrency(totalPremium)}</span>
                                </div>
                            )}
                            {totalTaxes > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxes</span>
                                    <span>+{formatCurrency(totalTaxes)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold pt-2 border-t">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                            {usdEquivalent !== null && (
                                <div className="flex justify-between text-muted-foreground pt-1">
                                    <span>USD Equivalent</span>
                                    <span>${usdEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <div>
                    {acquisition && (
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
                        {loading ? 'Saving...' : (acquisition ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
