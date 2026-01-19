import { InsuranceForm } from '../insurance-form'

export default function NewInsurancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Add Insurance Policy</h1>
                <p className="text-muted-foreground">Create a new insurance policy for your collection.</p>
            </div>
            <InsuranceForm />
        </div>
    )
}
