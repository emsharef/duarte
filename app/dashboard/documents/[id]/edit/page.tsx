import { getDocument } from '@/app/actions/documents'
import { DocumentForm } from '../../document-form'
import { notFound } from 'next/navigation'

export default async function EditDocumentPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const document = await getDocument(id)

    if (!document) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Document</h1>
                <p className="text-muted-foreground">Update document information.</p>
            </div>
            <DocumentForm document={document} />
        </div>
    )
}
