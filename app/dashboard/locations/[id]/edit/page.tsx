import { getLocation } from '@/app/actions/locations'
import { LocationForm } from '../../location-form'
import { notFound } from 'next/navigation'

export default async function EditLocationPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const location = await getLocation(id)

    if (!location) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Location</h1>
                <p className="text-muted-foreground">Update location information.</p>
            </div>
            <LocationForm location={location} />
        </div>
    )
}
