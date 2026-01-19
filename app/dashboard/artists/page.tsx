import { getArtists } from '@/app/actions/artists'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Artists</h1>
                    <p className="text-muted-foreground">Manage artist profiles and details.</p>
                </div>
                {/* We can add a "Create Artist" button here later if needed, 
            but for now we rely on the object creation flow or just add a simple one */}
            </div>

            <div className="border rounded-md">
                <Table>
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
                                <TableCell className="font-medium">{artist.last_name || '-'}</TableCell>
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
                        {artists.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No artists found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
