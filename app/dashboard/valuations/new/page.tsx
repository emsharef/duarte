import { ValuationForm } from '../valuation-form'

export default function NewValuationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Add Valuation</h1>
                <p className="text-muted-foreground">Create a new appraisal or valuation record.</p>
            </div>
            <ValuationForm />
        </div>
    )
}
