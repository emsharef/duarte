'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { uploadDocument, updateDocument, deleteDocument, Document } from '@/app/actions/documents'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { Upload, FileText, X } from 'lucide-react'

type DocumentFormProps = {
    document?: Document
}

export function DocumentForm({ document }: DocumentFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        try {
            if (document) {
                // Update existing document metadata
                const data: Partial<Document> = {
                    document_type: formData.get('document_type') as string || undefined,
                    document_name: formData.get('document_name') as string,
                    description: formData.get('description') as string || undefined,
                    document_date: formData.get('document_date') as string || undefined,
                }
                await updateDocument(document.id, data)
            } else {
                // Upload new document
                if (!selectedFile) {
                    setError('Please select a file to upload')
                    setLoading(false)
                    return
                }
                formData.set('file', selectedFile)
                await uploadDocument(formData)
            }
            router.push('/dashboard/documents')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!document) return
        if (!confirm('Are you sure you want to delete this document? This will also remove the file from storage.')) return

        setLoading(true)
        try {
            await deleteDocument(document.id)
            router.push('/dashboard/documents')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
    }

    function clearSelectedFile() {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {!document && (
                <div className="space-y-2">
                    <Label>File *</Label>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        clearSelectedFile()
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    Click to select a file or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PDF, images, documents up to 10MB
                                </p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                    />
                </div>
            )}

            {document && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{document.original_filename}</p>
                            <p className="text-sm text-muted-foreground">
                                {document.mime_type} - {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : ''}
                            </p>
                        </div>
                        {document.signed_url && (
                            <a
                                href={document.signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto"
                            >
                                <Button type="button" variant="outline" size="sm">
                                    View File
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label htmlFor="document_name">Document Name *</Label>
                    <Input
                        id="document_name"
                        name="document_name"
                        required
                        defaultValue={document?.document_name || selectedFile?.name || ''}
                        placeholder="e.g., Certificate of Authenticity"
                    />
                </div>

                <div>
                    <Label htmlFor="document_type">Type</Label>
                    <Select name="document_type" defaultValue={document?.document_type || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="document_date">Document Date</Label>
                    <Input
                        id="document_date"
                        name="document_date"
                        type="date"
                        defaultValue={document?.document_date || ''}
                    />
                </div>

                <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={document?.description || ''}
                        placeholder="Additional details about this document..."
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <div>
                    {document && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Delete
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : (document ? 'Update' : 'Upload')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
