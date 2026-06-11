import { DocumentForm } from '../document-form'

export default function NewDocumentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Upload Document</h1>
                <p className="text-muted-foreground">Upload a new document to your collection.</p>
            </div>
            <DocumentForm />
        </div>
    )
}
