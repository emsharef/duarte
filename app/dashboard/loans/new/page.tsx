import { LoanForm } from '../loan-form'

export default function NewLoanPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Add Loan</h1>
                <p className="text-muted-foreground">Create a new loan record.</p>
            </div>
            <LoanForm />
        </div>
    )
}
