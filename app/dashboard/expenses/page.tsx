import { getExpenses } from '@/app/actions/expenses'
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
    return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00').toLocaleDateString()
}

export default async function ExpensesPage() {
    const expenses = await getExpenses()

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Track costs associated with your collection.</p>
                </div>
                <Link href="/dashboard/expenses/new">
                    <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Button>
                </Link>
            </div>

            {expenses.length === 0 ? (
                <EmptyState
                    text="No expenses yet."
                    action={
                        <Link href="/dashboard/expenses/new" className="text-[13px] font-medium text-primary underline-offset-4 hover:underline">
                            Record your first expense
                        </Link>
                    }
                />
            ) : (
            <div className="border rounded-md">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Object</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>
                                    {expense.expense_type && (
                                        <Badge variant="outline">{expense.expense_type}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {expense.object?.title || '-'}
                                </TableCell>
                                <TableCell>{expense.vendor_contact?.display_name || '-'}</TableCell>
                                <TableCell>{formatDate(expense.expense_date)}</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(expense.amount, expense.currency)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {expense.description || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/expenses/${expense.id}`}>
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
