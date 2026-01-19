import { getValuations } from '@/app/actions/valuations'
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

export default async function ValuationsPage() {
    const valuations = await getValuations()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Valuations</h1>
                    <p className="text-muted-foreground">Track appraisals and collection valuations.</p>
                </div>
                <Link href="/dashboard/valuations/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Valuation
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Appraiser</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total Value</TableHead>
                            <TableHead className="text-center">Objects</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {valuations.map((val) => (
                            <TableRow key={val.id}>
                                <TableCell className="font-medium">{val.valuation_subject || '-'}</TableCell>
                                <TableCell>
                                    {val.value_type && (
                                        <Badge variant="outline">{val.value_type}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{val.appraiser_contact?.display_name || '-'}</TableCell>
                                <TableCell>{formatDate(val.valuation_date)}</TableCell>
                                <TableCell>
                                    <Badge variant={val.valuation_status === 'Closed' ? 'secondary' : 'default'}>
                                        {val.valuation_status || 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(val.total_value, val.currency)}
                                </TableCell>
                                <TableCell className="text-center">{val.object_count || 0}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/valuations/${val.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {valuations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No valuations found. Create your first valuation.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
