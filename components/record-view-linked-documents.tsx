'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { RecordSection, RecordEmpty, formatRecordDate } from '@/components/record-view'
import { toastError } from '@/components/object/shared'
import {
    getDocuments, uploadDocument, linkDocumentToEntity, unlinkDocumentFromEntity,
} from '@/app/actions/documents'

export type LinkedDocument = {
    id: string
    document_name: string
    document_type?: string | null
    document_date?: string | null
}

type EntityType = 'loan' | 'acquisition' | 'valuation' | 'insurance' | 'expense'

type LinkedDocumentsSectionProps = {
    items: LinkedDocument[]
    entityType: EntityType
    entityId: string
    canEdit: boolean
}

// Client section for the module view pages: renders the linked-documents list
// with hover remove controls plus an "Attach document" dialog offering both
// new-upload and link-existing modes. All mutations refresh the route.
export function LinkedDocumentsSection({
    items, entityType, entityId, canEdit,
}: LinkedDocumentsSectionProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'new' | 'existing'>('new')
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState<string | null>(null)

    // Upload-new fields
    const [file, setFile] = useState<File | null>(null)
    const [name, setName] = useState('')
    const [docType, setDocType] = useState('')
    const [docDate, setDocDate] = useState('')

    // Link-existing fields
    const [options, setOptions] = useState<LinkedDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState('')

    const linkedIds = useMemo(() => new Set(items.map((i) => i.id)), [items])

    useEffect(() => {
        if (!open) return
        setMode('new')
        setFile(null)
        setName('')
        setDocType('')
        setDocDate('')
        setQuery('')
        setSelectedId('')
    }, [open])

    useEffect(() => {
        if (!open || mode !== 'existing' || options.length > 0) return
        setLoading(true)
        getDocuments()
            .then((docs) => setOptions(docs as LinkedDocument[]))
            .catch(() => setOptions([]))
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return options
            .filter((d) => !linkedIds.has(d.id))
            .filter((d) => !q || d.document_name.toLowerCase().includes(q) || (d.document_type || '').toLowerCase().includes(q))
    }, [options, query, linkedIds])

    async function handleSubmit() {
        setSaving(true)
        try {
            if (mode === 'new') {
                if (!file) {
                    toastError('Choose a file to upload')
                    return
                }
                const formData = new FormData()
                formData.set('file', file)
                if (name) formData.set('document_name', name)
                if (docType) formData.set('document_type', docType)
                if (docDate) formData.set('document_date', docDate)
                const doc = await uploadDocument(formData)
                if (!doc?.id) throw new Error('Upload failed')
                await linkDocumentToEntity(doc.id, entityType, entityId)
            } else {
                if (!selectedId) {
                    toastError('Select a document to link')
                    return
                }
                await linkDocumentToEntity(selectedId, entityType, entityId)
            }
            setOpen(false)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to attach document')
        } finally {
            setSaving(false)
        }
    }

    async function handleUnlink(documentId: string) {
        if (!confirm('Remove this document from the record?')) return
        setBusyId(documentId)
        try {
            await unlinkDocumentFromEntity(documentId, entityType, entityId)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to remove document')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <RecordSection
            title="Documents"
            count={items.length}
            action={canEdit && (
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    <Paperclip className="mr-1 h-3.5 w-3.5" /> Attach document
                </Button>
            )}
        >
            {items.length === 0 ? (
                <RecordEmpty text="No documents linked to this record." />
            ) : (
                <ul className="border-y divide-y">
                    {items.map((doc) => (
                        <li key={doc.id} className="group flex items-center justify-between gap-4 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <Link href={`/dashboard/documents/${doc.id}`} className="truncate text-sm font-medium hover:underline">
                                    {doc.document_name}
                                </Link>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {[doc.document_type, formatRecordDate(doc.document_date)].filter(Boolean).join(' · ')}
                                </span>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => handleUnlink(doc.id)}
                                        disabled={busyId === doc.id}
                                        title="Remove document"
                                        className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Attach document</DialogTitle>
                        <DialogDescription>
                            Upload a new document or link an existing one to this record.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex rounded-lg border p-0.5">
                            {(['new', 'existing'] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMode(m)}
                                    className={cn(
                                        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium',
                                        mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                                    )}
                                >
                                    {m === 'new' ? 'Upload new' : 'Link existing'}
                                </button>
                            ))}
                        </div>

                        {mode === 'new' ? (
                            <div className="space-y-3">
                                <div className="grid gap-2">
                                    <Label>File</Label>
                                    <Input
                                        type="file"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] || null
                                            setFile(f)
                                            if (f && !name) setName(f.name)
                                        }}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g. Invoice, Certificate" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>Document</Label>
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={loading ? 'Loading...' : 'Search documents...'}
                                />
                                <div className="max-h-56 overflow-y-auto rounded-md border">
                                    {filtered.length === 0 ? (
                                        <p className="px-3 py-2 text-sm text-muted-foreground">
                                            {loading ? 'Loading...' : 'No documents found'}
                                        </p>
                                    ) : (
                                        filtered.map((d) => (
                                            <button
                                                key={d.id}
                                                type="button"
                                                onClick={() => setSelectedId(d.id)}
                                                className={cn(
                                                    'flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted',
                                                    selectedId === d.id ? 'bg-muted' : '',
                                                )}
                                            >
                                                <span className="font-medium">{d.document_name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {[d.document_type, formatRecordDate(d.document_date)].filter(Boolean).join(' · ')}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Saving...' : mode === 'new' ? 'Upload & attach' : 'Attach'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </RecordSection>
    )
}
