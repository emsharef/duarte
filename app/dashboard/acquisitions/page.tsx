import { getAcquisitions } from '@/app/actions/acquisitions'
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

function formatCurrency(amount: number | undefined | null, currency = 'USD') {
    if (amount == null) return '-'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount)
}

function formatDate(dateStr: string | undefined | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
}

export default async function AcquisitionsPage() {
    const acquisitions = await getAcquisitions()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Acquisitions</h1>
                    <p className="text-muted-foreground">Track purchases, gifts, and other acquisitions.</p>
                </div>
                <Link href="/dashboard/acquisitions/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Acquisition
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                            <TableHead className="text-center">Objects</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {acquisitions.map((acq) => (
                            <TableRow key={acq.id}>
                                <TableCell className="font-medium">{acq.acquisition_subject || '-'}</TableCell>
                                <TableCell>
                                    {acq.acquisition_type && (
                                        <Badge variant="outline">{acq.acquisition_type}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{acq.acquired_from_contact?.display_name || '-'}</TableCell>
                                <TableCell>{formatDate(acq.acquisition_date)}</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(acq.total_cost, acq.currency)}
                                </TableCell>
                                <TableCell className="text-center">{acq.object_count || 0}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/acquisitions/${acq.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {acquisitions.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7} className="p-3">
                                    <EmptyState
                                        text="No acquisitions yet."
                                        action={
                                            <Link href="/dashboard/acquisitions/new" className="text-[13px] font-medium text-primary underline-offset-4 hover:underline">
                                                Record your first acquisition
                                            </Link>
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
