'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Star, Trash2, Pencil, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    ObjectWithRelations, addObjectMedia, deleteObjectMedia,
    setObjectMediaPrimary, updateObjectMedia,
} from '@/app/dashboard/objects/actions'
import { EmptyState, toastError } from './shared'
import { cn } from '@/lib/utils'

type Media = NonNullable<ObjectWithRelations['object_media']>[number]

type ImagesTabProps = {
    object: ObjectWithRelations
    canEdit: boolean
}

export function ImagesTab({ object, canEdit }: ImagesTabProps) {
    const router = useRouter()
    const media = object.object_media || []
    const [uploading, setUploading] = useState(0)
    const [editing, setEditing] = useState<Media | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    // Existing upload flow: proxy resizes + stores in R2, returns keys.
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        e.target.value = ''
        setUploading((n) => n + files.length)
        const hadMedia = media.length > 0

        for (const [i, file] of files.entries()) {
            const formData = new FormData()
            formData.append('file', file)
            try {
                const res = await fetch('/api/upload-proxy', { method: 'POST', body: formData })
                const data = await res.json()
                if (!data.success) throw new Error(data.error || 'Upload failed')
                await addObjectMedia(object.id, [{
                    keys: data.keys,
                    name: file.name.split('.')[0],
                    is_primary: !hadMedia && i === 0,
                }])
            } catch (err) {
                toastError(err instanceof Error ? err.message : 'Upload failed')
            } finally {
                setUploading((n) => n - 1)
            }
        }
        router.refresh()
    }

    function openEdit(item: Media) {
        setEditing(item)
        setName(item.name || '')
        setDescription(item.description || '')
    }

    async function saveEdit() {
        if (!editing) return
        setSaving(true)
        try {
            await updateObjectMedia(editing.id, { name, description })
            setEditing(null)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to save image details')
        } finally {
            setSaving(false)
        }
    }

    async function handleSetPrimary(item: Media) {
        try {
            await setObjectMediaPrimary(object.id, item.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to set primary image')
        }
    }

    async function handleDelete(item: Media) {
        if (!confirm('Delete this image?')) return
        try {
            await deleteObjectMedia(item.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to delete image')
        }
    }

    return (
        <div className="space-y-4">
            {media.length === 0 && uploading === 0 && (
                <EmptyState text="No images yet." />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            'group relative rounded-lg border overflow-hidden bg-muted',
                            item.is_primary && 'ring-2 ring-blue-500'
                        )}
                    >
                        <div className="aspect-square">
                            {item.signed_url && (
                                <img src={item.signed_url} alt={item.name || ''} className="w-full h-full object-cover" />
                            )}
                        </div>
                        {item.is_primary && (
                            <span className="absolute top-1.5 left-1.5 rounded bg-blue-500 text-white text-xs px-1.5 py-0.5">
                                Primary
                            </span>
                        )}
                        <div className="p-2 bg-card">
                            <p className="text-xs font-medium truncate">{item.name || 'Untitled'}</p>
                            {item.description && (
                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            )}
                        </div>
                        {canEdit && (
                            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!item.is_primary && (
                                    <Button variant="secondary" size="icon" className="h-7 w-7" title="Set as primary"
                                        onClick={() => handleSetPrimary(item)}>
                                        <Star className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                <Button variant="secondary" size="icon" className="h-7 w-7" title="Edit details"
                                    onClick={() => openEdit(item)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="secondary" size="icon" className="h-7 w-7 text-red-600" title="Delete"
                                    onClick={() => handleDelete(item)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}

                {uploading > 0 && Array.from({ length: uploading }).map((_, i) => (
                    <div key={`uploading-${i}`} className="aspect-square rounded-lg border bg-muted flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ))}
            </div>

            {canEdit && (
                <Label className="cursor-pointer border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium">Add images</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG, WEBP</span>
                    <Input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                </Label>
            )}

            <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit image details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="media-name">Name</Label>
                            <Input id="media-name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="media-description">Description</Label>
                            <Textarea id="media-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
