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
import { createContact, updateContact, deleteContact, Contact } from '@/app/actions/contacts'
import { CONTACT_TYPES } from '@/lib/constants'

type ContactFormProps = {
    contact?: Contact
}

export function ContactForm({ contact }: ContactFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data: Partial<Contact> = {
            contact_type: formData.get('contact_type') as string || undefined,
            first_name: formData.get('first_name') as string || undefined,
            last_name: formData.get('last_name') as string || undefined,
            company_name: formData.get('company_name') as string || undefined,
            email: formData.get('email') as string || undefined,
            phone: formData.get('phone') as string || undefined,
            mobile: formData.get('mobile') as string || undefined,
            website: formData.get('website') as string || undefined,
            address_line1: formData.get('address_line1') as string || undefined,
            address_line2: formData.get('address_line2') as string || undefined,
            city: formData.get('city') as string || undefined,
            state: formData.get('state') as string || undefined,
            postal_code: formData.get('postal_code') as string || undefined,
            country: formData.get('country') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        }

        try {
            if (contact) {
                await updateContact(contact.id, data)
            } else {
                await createContact(data)
            }
            router.push('/dashboard/contacts')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!contact) return
        if (!confirm('Are you sure you want to delete this contact?')) return

        setLoading(true)
        try {
            await deleteContact(contact.id)
            router.push('/dashboard/contacts')
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
                    <Label htmlFor="contact_type">Contact Type</Label>
                    <Select name="contact_type" defaultValue={contact?.contact_type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {CONTACT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                        id="first_name"
                        name="first_name"
                        defaultValue={contact?.first_name || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                        id="last_name"
                        name="last_name"
                        defaultValue={contact?.last_name || ''}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="company_name">Company / Organization</Label>
                    <Input
                        id="company_name"
                        name="company_name"
                        defaultValue={contact?.company_name || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={contact?.email || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        name="phone"
                        defaultValue={contact?.phone || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                        id="mobile"
                        name="mobile"
                        defaultValue={contact?.mobile || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        name="website"
                        defaultValue={contact?.website || ''}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                        id="address_line1"
                        name="address_line1"
                        defaultValue={contact?.address_line1 || ''}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                        id="address_line2"
                        name="address_line2"
                        defaultValue={contact?.address_line2 || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        name="city"
                        defaultValue={contact?.city || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                        id="state"
                        name="state"
                        defaultValue={contact?.state || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                        id="postal_code"
                        name="postal_code"
                        defaultValue={contact?.postal_code || ''}
                    />
                </div>

                <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                        id="country"
                        name="country"
                        defaultValue={contact?.country || ''}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        defaultValue={contact?.notes || ''}
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {contact && (
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
                        {loading ? 'Saving...' : (contact ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
