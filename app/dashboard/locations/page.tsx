import { getLocationsWithCounts } from '@/app/actions/locations'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { Plus } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function LocationsPage() {
    const locations = await getLocationsWithCounts()

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Locations</h1>
                    <p className="text-muted-foreground">Manage storage locations for your collection.</p>
                </div>
                <Link href="/dashboard/locations/new">
                    <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Location
                    </Button>
                </Link>
            </div>

            {locations.length === 0 ? (
                <EmptyState
                    text="No locations yet."
                    action={
                        <Link href="/dashboard/locations/new" className="text-[13px] font-medium text-primary underline-offset-4 hover:underline">
                            Add your first location
                        </Link>
                    }
                />
            ) : (
            <div className="border rounded-md">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Parent Location</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead className="text-center">Sub-locations</TableHead>
                            <TableHead className="text-center">Objects</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.map((location) => (
                            <TableRow key={location.id}>
                                <TableCell>
                                    <Link href={`/dashboard/locations/${location.id}`} className="font-medium hover:underline">
                                        {location.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {location.type && (
                                        <Badge variant="outline">{location.type}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{location.parent?.name || '-'}</TableCell>
                                <TableCell>{location.city || '-'}</TableCell>
                                <TableCell className="text-center">{location.children_count || 0}</TableCell>
                                <TableCell className="text-center">{location.object_count || 0}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/locations/${location.id}`}>
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
