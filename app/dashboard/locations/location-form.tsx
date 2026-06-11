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
import { createLocation, updateLocation, deleteLocation, getLocations, Location } from '@/app/actions/locations'
import { LOCATION_TYPES } from '@/lib/constants'

type LocationFormProps = {
    location?: Location
}

export function LocationForm({ location }: LocationFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [parentLocations, setParentLocations] = useState<Array<{ id: string; name: string }>>([])

    useEffect(() => {
        getLocations().then((locs) => {
            // Filter out current location from parent options
            setParentLocations(locs.filter(l => l.id !== location?.id))
        })
    }, [location?.id])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const parentId = formData.get('parent_id') as string
        const data: Partial<Location> = {
            name: formData.get('name') as string,
            type: formData.get('type') as string || undefined,
            description: formData.get('description') as string || undefined,
            parent_id: parentId && parentId !== 'none' ? parentId : undefined,
        }

        try {
            if (location) {
                await updateLocation(location.id, data)
            } else {
                await createLocation(data)
            }
            router.push('/dashboard/locations')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!location) return
        if (!confirm('Are you sure you want to delete this location?')) return

        setLoading(true)
        try {
            await deleteLocation(location.id)
            router.push('/dashboard/locations')
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
                    <Label htmlFor="name">Location Name *</Label>
                    <Input
                        id="name"
                        name="name"
                        required
                        defaultValue={location?.name || ''}
                        placeholder="e.g., Main Gallery, Storage Room A"
                    />
                </div>

                <div>
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue={location?.type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {LOCATION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="parent_id">Parent Location</Label>
                    <Select name="parent_id" defaultValue={location?.parent_id || 'none'}>
                        <SelectTrigger>
                            <SelectValue placeholder="None (top level)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None (top level)</SelectItem>
                            {parentLocations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        rows={2}
                        defaultValue={location?.description || ''}
                        placeholder="Additional details about this location..."
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {location && (
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
                        {loading ? 'Saving...' : (location ? 'Update' : 'Create')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
