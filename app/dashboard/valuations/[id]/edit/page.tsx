import { getValuation } from '@/app/actions/valuations'
import { ValuationForm } from '../../valuation-form'
import { notFound } from 'next/navigation'

export default async function EditValuationPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const valuation = await getValuation(id)

    if (!valuation) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Valuation</h1>
                <p className="text-muted-foreground">Update valuation information.</p>
            </div>
            <ValuationForm valuation={valuation} />
        </div>
    )
}
