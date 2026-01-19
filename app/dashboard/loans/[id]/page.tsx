import { getLoan } from '@/app/actions/loans'
import { LoanForm } from '../loan-form'
import { notFound } from 'next/navigation'

export default async function EditLoanPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const loan = await getLoan(id)

    if (!loan) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Loan</h1>
                <p className="text-muted-foreground">Update loan information.</p>
            </div>
            <LoanForm loan={loan} />
        </div>
    )
}
