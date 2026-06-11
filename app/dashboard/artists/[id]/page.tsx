import Link from 'next/link'
import { OBJECT_STATUS_LABELS } from '@/lib/constants'
import { notFound } from 'next/navigation'
import { getArtist, getArtistObjects } from '@/app/actions/artists'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
} from '@/components/record-view'

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const artist = await getArtist(id)

    if (!artist) {
        notFound()
    }

    const objects = await getArtistObjects(id)

    const name = `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
        || artist.company
        || 'Unnamed Artist'

    const lifespan = artist.birth_year
        ? `${artist.birth_year}–${artist.death_year || ''}`
        : artist.death_year
            ? `–${artist.death_year}`
            : null

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/artists"
                backLabel="Back to Artists"
                editHref={`/dashboard/artists/${id}/edit`}
            />

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">{name}</h1>
                    {(artist.nationality || lifespan) && (
                        <p className="mt-1 text-muted-foreground">
                            {[artist.nationality, lifespan].filter(Boolean).join(', ')}
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Company">{artist.company}</RecordField>
                    <RecordField label="AKA">{artist.aka}</RecordField>
                    <RecordField label="Born">{artist.birth_year}</RecordField>
                    <RecordField label="Died">{artist.death_year}</RecordField>
                    <RecordField label="Website">
                        {artist.website ? (
                            <a href={artist.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {artist.website}
                            </a>
                        ) : null}
                    </RecordField>
                </div>
                {artist.bio && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                        {artist.bio}
                    </p>
                )}
            </div>

            <RecordSection title="Objects" count={objects.length}>
                {objects.length === 0 ? (
                    <RecordEmpty text="No objects by this artist." />
                ) : (
                    <ul className="border-y divide-y">
                        {objects.map((obj) => (
                            <li key={obj.id} className="flex items-center justify-between gap-4 py-3">
                                <div className="min-w-0">
                                    <Link href={`/dashboard/objects/${obj.id}`} className="text-sm font-medium italic hover:underline">
                                        {obj.title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        {[obj.date_text || obj.year_created, obj.inventory_number].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">{obj.status ? OBJECT_STATUS_LABELS[obj.status] ?? obj.status : null}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </RecordSection>
        </div>
    )
}
