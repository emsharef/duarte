import { getDocumentsWithUrls } from '@/app/actions/documents'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { Plus, FileText, Download, ExternalLink } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00').toLocaleDateString()
}

function formatFileSize(bytes?: number | null) {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType?: string) {
    if (!mimeType) return FileText
    if (mimeType.startsWith('image/')) return FileText
    if (mimeType === 'application/pdf') return FileText
    return FileText
}

export default async function DocumentsPage() {
    const documents = await getDocumentsWithUrls()

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground">Manage documents and files for your collection.</p>
                </div>
                <Link href="/dashboard/documents/new">
                    <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Document
                    </Button>
                </Link>
            </div>

            {documents.length === 0 ? (
                <EmptyState
                    text="No documents yet."
                    action={
                        <Link href="/dashboard/documents/new" className="text-[13px] font-medium text-primary underline-offset-4 hover:underline">
                            Upload your first document
                        </Link>
                    }
                />
            ) : (
            <div className="border rounded-md">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead className="text-center">Linked To</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <Link href={`/dashboard/documents/${doc.id}`} className="font-medium hover:underline">
                                            {doc.document_name}
                                        </Link>
                                    </div>
                                    {doc.description && (
                                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                                            {doc.description}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {doc.document_type && (
                                        <Badge variant="outline">{doc.document_type}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{formatDate(doc.document_date)}</TableCell>
                                <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                                <TableCell className="text-center">
                                    {doc.linked_entities && doc.linked_entities.length > 0 ? (
                                        <Badge variant="secondary">
                                            {doc.linked_entities.length} {doc.linked_entities.length === 1 ? 'item' : 'items'}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {doc.signed_url && (
                                            <a href={doc.signed_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        )}
                                        <Link href={`/dashboard/documents/${doc.id}/edit`}>
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}
        </div>
    )
}
