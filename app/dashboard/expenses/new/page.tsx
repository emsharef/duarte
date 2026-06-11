import { ExpenseForm } from '../expense-form'

export default function NewExpensePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Add Expense</h1>
                <p className="text-muted-foreground">Record a new expense for your collection.</p>
            </div>
            <ExpenseForm />
        </div>
    )
}
