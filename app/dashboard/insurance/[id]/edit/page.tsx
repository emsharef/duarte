import { getInsurancePolicy } from '@/app/actions/insurance'
import { InsuranceForm } from '../../insurance-form'
import { notFound } from 'next/navigation'

export default async function EditInsurancePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const policy = await getInsurancePolicy(id)

    if (!policy) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Policy</h1>
                <p className="text-muted-foreground">Update insurance policy information.</p>
            </div>
            <InsuranceForm policy={policy} />
        </div>
    )
}
