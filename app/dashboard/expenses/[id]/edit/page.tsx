import { getExpense } from '@/app/actions/expenses'
import { ExpenseForm } from '../../expense-form'
import { notFound } from 'next/navigation'

export default async function EditExpensePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const expense = await getExpense(id)

    if (!expense) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Expense</h1>
                <p className="text-muted-foreground">Update expense information.</p>
            </div>
            <ExpenseForm expense={expense} />
        </div>
    )
}
