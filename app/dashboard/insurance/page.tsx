import { getInsurancePolicies } from '@/app/actions/insurance'
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

export default async function InsurancePage() {
    const policies = await getInsurancePolicies()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Insurance Policies</h1>
                    <p className="text-muted-foreground">Manage insurance coverage for your collection.</p>
                </div>
                <Link href="/dashboard/insurance/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Policy
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Policy</TableHead>
                            <TableHead>Policy Number</TableHead>
                            <TableHead>Insurer</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Coverage</TableHead>
                            <TableHead className="text-center">Objects</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {policies.map((policy) => (
                            <TableRow key={policy.id}>
                                <TableCell className="font-medium">{policy.policy_subject || '-'}</TableCell>
                                <TableCell>{policy.policy_number || '-'}</TableCell>
                                <TableCell>{policy.insurer_contact?.display_name || '-'}</TableCell>
                                <TableCell>{formatDate(policy.start_date)}</TableCell>
                                <TableCell>{formatDate(policy.end_date)}</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(policy.total_coverage, policy.currency)}
                                </TableCell>
                                <TableCell className="text-center">{policy.object_count || 0}</TableCell>
                                <TableCell>
                                    <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                                        {policy.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/insurance/${policy.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {policies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No insurance policies found. Add your first policy.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
