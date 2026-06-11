import { getLoansWithDetails } from '@/app/actions/loans'
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

function getStatusColor(status?: string) {
    switch (status) {
        case 'Active':
            return 'default'
        case 'Pending':
            return 'secondary'
        case 'Returned':
            return 'outline'
        case 'Overdue':
            return 'destructive'
        default:
            return 'secondary'
    }
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00').toLocaleDateString()
}

export default async function LoansPage() {
    const loans = await getLoansWithDetails()

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Loans</h1>
                    <p className="text-muted-foreground">Track incoming and outgoing loans.</p>
                </div>
                <Link href="/dashboard/loans/new">
                    <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Loan
                    </Button>
                </Link>
            </div>

            {loans.length === 0 ? (
                <EmptyState
                    text="No loans yet."
                    action={
                        <Link href="/dashboard/loans/new" className="text-[13px] font-medium text-primary underline-offset-4 hover:underline">
                            Add your first loan
                        </Link>
                    }
                />
            ) : (
            <div className="border rounded-md">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Direction</TableHead>
                            <TableHead>Borrower/Lender</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-center">Objects</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loans.map((loan) => (
                            <TableRow key={loan.id}>
                                <TableCell>
                                    <Link href={`/dashboard/loans/${loan.id}`} className="font-medium hover:underline">
                                        {loan.loan_subject || 'Untitled Loan'}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={loan.direction === 'out' ? 'default' : 'secondary'}>
                                        {loan.direction === 'out' ? 'Loan Out' : 'Loan In'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {loan.direction === 'out'
                                        ? (loan.borrower?.display_name || loan.borrower?.company_name || '-')
                                        : (loan.lender?.display_name || loan.lender?.company_name || '-')
                                    }
                                </TableCell>
                                <TableCell>{formatDate(loan.start_date)}</TableCell>
                                <TableCell>{formatDate(loan.end_date)}</TableCell>
                                <TableCell className="text-center">{loan.object_count || 0}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(loan.status)}>
                                        {loan.status || 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/loans/${loan.id}/edit`}>
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
