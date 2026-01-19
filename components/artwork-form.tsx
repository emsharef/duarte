'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { createArtwork } from '@/app/dashboard/actions'
import { uploadImage } from '@/app/actions/upload'

export function ArtworkForm() {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [imageKey, setImageKey] = useState<string | null>(null)

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return
        setUploading(true)
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload-proxy', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                throw new Error('Upload failed')
            }

            const result = await res.json()
            if (result.success && result.key) {
                setImageKey(result.key)
            } else {
                console.error('Upload failed:', result.error)
            }
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(formData: FormData) {
        if (imageKey) {
            formData.set('r2_image_key', imageKey)
        }
        await createArtwork(formData)
        setOpen(false)
        setImageKey(null)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>Add Artwork</Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Add New Artwork</SheetTitle>
                    <SheetDescription>
                        Add a new piece to your collection. Click save when you're done.
                    </SheetDescription>
                </SheetHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="artist">Artist</Label>
                            <Input id="artist" name="artist_name" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="year">Year</Label>
                            <Input id="year" name="year_created" type="number" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue="Available">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Sold">Sold</SelectItem>
                                    <SelectItem value="Loaned">Loaned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" placeholder="e.g. Warehouse A" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Image</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="cursor-pointer"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        {imageKey && <p className="text-xs text-green-600">Image uploaded successfully</p>}
                    </div>
                    <div className="flex justify-end pt-4">
                        <SubmitButton />
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Artwork'}
        </Button>
    )
}
