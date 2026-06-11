import Link from 'next/link'
import { OBJECT_STATUS_LABELS } from '@/lib/constants'
import { notFound } from 'next/navigation'
import {
    getLocationWithParent, getLocationChildren, getLocationObjects, deleteLocation,
} from '@/app/actions/locations'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'

export default async function LocationPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const location = await getLocationWithParent(id)

    if (!location) {
        notFound()
    }

    const [children, objects] = await Promise.all([
        getLocationChildren(id),
        getLocationObjects(id),
    ])

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/locations"
                backLabel="Back to Locations"
                editHref={`/dashboard/locations/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteLocation.bind(null, id)}
                    redirectTo="/dashboard/locations"
                    confirmMessage="Are you sure you want to delete this location?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">{location.name}</h1>
                    {location.type && <p className="mt-1 text-muted-foreground">{location.type}</p>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Type">{location.type}</RecordField>
                    <RecordField label="Parent location">
                        {location.parent ? (
                            <Link href={`/dashboard/locations/${location.parent.id}`} className="hover:underline">
                                {location.parent.name}
                            </Link>
                        ) : null}
                    </RecordField>
                    <RecordField label="Sub-locations">{children.length || null}</RecordField>
                    <RecordField label="Objects">{objects.length || null}</RecordField>
                </div>
                {location.description && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {location.description}
                    </p>
                )}
            </div>

            <RecordSection title="Sub-locations" count={children.length}>
                {children.length === 0 ? (
                    <RecordEmpty text="No sub-locations." />
                ) : (
                    <ul className="border-y divide-y">
                        {children.map((child) => (
                            <li key={child.id} className="flex items-center justify-between gap-4 py-3">
                                <Link href={`/dashboard/locations/${child.id}`} className="text-sm font-medium hover:underline">
                                    {child.name}
                                </Link>
                                <span className="shrink-0 text-xs text-muted-foreground">{child.type}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Objects at this location" count={objects.length}>
                {objects.length === 0 ? (
                    <RecordEmpty text="No objects at this location." />
                ) : (
                    <ul className="border-y divide-y">
                        {objects.map((obj) => {
                            const artist = obj.artist
                                ? `${obj.artist.first_name || ''} ${obj.artist.last_name || ''}`.trim()
                                : ''
                            return (
                                <li key={obj.id} className="flex items-center justify-between gap-4 py-3">
                                    <div className="min-w-0">
                                        <Link href={`/dashboard/objects/${obj.id}`} className="text-sm font-medium italic hover:underline">
                                            {obj.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {[artist, obj.inventory_number].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-muted-foreground">{obj.status ? OBJECT_STATUS_LABELS[obj.status] ?? obj.status : null}</span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </RecordSection>
        </div>
    )
}
