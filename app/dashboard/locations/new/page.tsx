import { LocationForm } from '../location-form'

export default function NewLocationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Add Location</h1>
                <p className="text-muted-foreground">Create a new storage location.</p>
            </div>
            <LocationForm />
        </div>
    )
}
