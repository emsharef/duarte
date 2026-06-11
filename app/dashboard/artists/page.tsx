import { getArtists } from '@/app/actions/artists'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { AddArtistDialog } from './add-artist-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default async function ArtistsPage() {
    const artists = await getArtists()

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Artists</h1>
                    <p className="text-muted-foreground">Manage artist profiles and details.</p>
                </div>
                <AddArtistDialog />
            </div>

            {artists.length === 0 ? (
                <EmptyState text="No artists yet. Use Add Artist to create one." />
            ) : (
            <div className="border rounded-md">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Last Name</TableHead>
                            <TableHead>First Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Nationality</TableHead>
                            <TableHead>Born</TableHead>
                            <TableHead>Died</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {artists.map((artist) => (
                            <TableRow key={artist.id}>
                                <TableCell>
                                    <Link href={`/dashboard/artists/${artist.id}`} className="font-medium hover:underline">
                                        {artist.last_name || '-'}
                                    </Link>
                                </TableCell>
                                <TableCell>{artist.first_name || '-'}</TableCell>
                                <TableCell>{artist.company || '-'}</TableCell>
                                <TableCell>{artist.nationality || '-'}</TableCell>
                                <TableCell>{artist.birth_year || '-'}</TableCell>
                                <TableCell>{artist.death_year || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/artists/${artist.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}
        </div>
    )
}
