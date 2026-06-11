import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDocument, getDocumentEntityLinks, deleteDocument } from '@/app/actions/documents'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty, formatRecordDate,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText } from 'lucide-react'

function formatFileSize(bytes?: number | null) {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ENTITY_ROUTES: Record<string, string> = {
    object: '/dashboard/objects',
    acquisition: '/dashboard/acquisitions',
    loan: '/dashboard/loans',
    contact: '/dashboard/contacts',
    artist: '/dashboard/artists',
    location: '/dashboard/locations',
}

export default async function DocumentPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const document = await getDocument(id)

    if (!document) {
        notFound()
    }

    const links = await getDocumentEntityLinks(id)

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/documents"
                backLabel="Back to Documents"
                editHref={`/dashboard/documents/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteDocument.bind(null, id)}
                    redirectTo="/dashboard/documents"
                    confirmMessage="Are you sure you want to delete this document? This will also remove the file from storage."
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">
                            {document.document_name}
                        </h1>
                        {document.document_type && (
                            <p className="mt-1 text-muted-foreground">{document.document_type}</p>
                        )}
                    </div>
                    {document.signed_url && (
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                            <a href={document.signed_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                Open File
                            </a>
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Original filename">{document.original_filename}</RecordField>
                    <RecordField label="File type">{document.mime_type}</RecordField>
                    <RecordField label="File size">{formatFileSize(document.file_size)}</RecordField>
                    <RecordField label="Document date">{formatRecordDate(document.document_date)}</RecordField>
                    <RecordField label="Uploaded">{formatRecordDate(document.created_at)}</RecordField>
                </div>
                {document.description && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {document.description}
                    </p>
                )}
            </div>

            <RecordSection title="Linked to" count={links.length}>
                {links.length === 0 ? (
                    <RecordEmpty text="This document is not linked to any records." />
                ) : (
                    <ul className="border-y divide-y">
                        {links.map((link) => {
                            const route = ENTITY_ROUTES[link.entity_type]
                            const label = link.label || `${link.entity_type} record`
                            return (
                                <li key={`${link.entity_type}-${link.entity_id}`} className="flex items-center justify-between gap-4 py-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        {route ? (
                                            <Link href={`${route}/${link.entity_id}`} className="truncate text-sm font-medium hover:underline">
                                                {label}
                                            </Link>
                                        ) : (
                                            <span className="truncate text-sm font-medium">{label}</span>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                                        {link.entity_type}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </RecordSection>
        </div>
    )
}
