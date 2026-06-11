'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, FileText, Plus, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { ObjectWithRelations } from '@/app/dashboard/objects/actions'
import {
    getDocuments, linkDocumentToEntity, unlinkDocumentFromEntity, uploadDocument,
} from '@/app/actions/documents'
import { LinkDialog } from './link-dialog'
import { EmptyState, SectionHeader, formatDate, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['documents']>[number]

export function DocumentsTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.documents || []
    const [addOpen, setAddOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [docName, setDocName] = useState('')
    const [docType, setDocType] = useState('Other')

    function openAdd() {
        setFile(null)
        setDocName('')
        setDocType('Other')
        setAddOpen(true)
    }

    async function handleAdd(mode: 'existing' | 'new', selectedId: string | null) {
        let documentId = selectedId
        if (mode === 'new') {
            if (!file) throw new Error('Choose a file to upload')
            const formData = new FormData()
            formData.append('file', file)
            formData.append('document_name', docName || file.name)
            formData.append('document_type', docType)
            const doc = await uploadDocument(formData)
            documentId = doc.id
        }
        if (!documentId) throw new Error('No document selected')
        await linkDocumentToEntity(documentId, 'object', object.id)
        router.refresh()
    }

    async function handleUnlink(row: Row) {
        if (!row.document?.id || !confirm('Unlink this document from the object?')) return
        try {
            await unlinkDocumentFromEntity(row.document.id, 'object', object.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to unlink document')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Documents"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? (
                <EmptyState text="No documents linked. Upload certificates, invoices, condition reports, and more." />
            ) : (
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{row.document?.document_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {row.document?.document_type || 'Document'} · {formatDate(row.document?.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {canEdit && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Unlink"
                                        onClick={() => handleUnlink(row)}>
                                        <Unlink className="h-4 w-4" />
                                    </Button>
                                )}
                                {row.document?.id && (
                                    <Link href={`/dashboard/documents/${row.document.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Open document">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <LinkDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                title="Add document"
                noun="document"
                loadOptions={async () => (await getDocuments()).map((d) => ({
                    id: d.id,
                    label: `${d.document_name}${d.document_type ? ` (${d.document_type})` : ''}`,
                }))}
                createFields={(
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>File</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Defaults to file name" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={docType} onValueChange={setDocType}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                onSubmit={handleAdd}
            />
        </div>
    )
}
