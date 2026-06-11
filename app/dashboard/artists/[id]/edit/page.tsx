import { getArtist } from '@/app/actions/artists'
import { ArtistForm } from '../artist-form'
import { notFound } from 'next/navigation'

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const artist = await getArtist(id)

    if (!artist) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Artist</h1>
                <p className="text-muted-foreground">Update profile for {artist.first_name} {artist.last_name} {artist.company}.</p>
            </div>
            <ArtistForm artist={artist} />
        </div>
    )
}
