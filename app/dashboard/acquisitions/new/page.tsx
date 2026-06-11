import { Suspense } from 'react'
import { AcquisitionForm } from '../acquisition-form'

export default function NewAcquisitionPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Add Acquisition</h1>
                <p className="text-muted-foreground">Record a new purchase, gift, or other acquisition.</p>
            </div>
            <Suspense fallback={<div className="text-muted-foreground">Loading form...</div>}>
                <AcquisitionForm />
            </Suspense>
        </div>
    )
}
