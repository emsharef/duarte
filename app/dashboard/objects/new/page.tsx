'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, X, Upload, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { createObject } from '../actions'
import { getArtists, createArtist } from '@/app/actions/artists'
import { CategoryPicker } from '@/components/category-picker'
import { LocationPicker } from '@/components/location-picker'
import { cn } from '@/lib/utils'
import { OBJECT_STATUSES, OBJECT_STATUS_LABELS } from '@/lib/constants'

type MediaItem = {
    id: string
    file: File
    name: string
    description: string
    is_primary: boolean
    uploading: boolean
    keys?: { original: string; medium: string; thumbnail: string }
}

type Dimension = {
    id: string
    type: string
    height: string
    width: string
    depth: string
    unit: string
}

const EDITION_TYPES = [
    { value: 'numbered', label: 'Numbered' },
    { value: 'AP', label: 'Artist’s Proof (AP)' },
    { value: 'HC', label: 'Hors Commerce (HC)' },
    { value: 'TP', label: 'Trial Proof (TP)' },
]

export default function NewObjectPage() {
    const [media, setMedia] = useState<MediaItem[]>([])
    const [dimensions, setDimensions] = useState<Dimension[]>([
        { id: '1', type: 'dimensions', height: '', width: '', depth: '', unit: 'cm' }
    ])
    const [artists, setArtists] = useState<{ id: string; first_name?: string | null; last_name?: string | null; company?: string | null }[]>([])
    const [selectedArtist, setSelectedArtist] = useState<string>('')
    const [artistSearch, setArtistSearch] = useState('')
    const [artistOpen, setArtistOpen] = useState(false)
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
    const [locationId, setLocationId] = useState<string | undefined>(undefined)
    const [permanentLocationId, setPermanentLocationId] = useState<string | undefined>(undefined)

    useEffect(() => {
        getArtists().then(setArtists)
    }, [])

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return

        const newFiles = Array.from(e.target.files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name.split('.')[0],
            description: '',
            is_primary: media.length === 0, // First image is primary by default
            uploading: true
        }))

        setMedia(prev => [...prev, ...newFiles])

        // Upload each file
        for (const item of newFiles) {
            const formData = new FormData()
            formData.append('file', item.file)

            try {
                const res = await fetch('/api/upload-proxy', {
                    method: 'POST',
                    body: formData,
                })
                const data = await res.json()

                if (data.success) {
                    setMedia(prev => prev.map(m =>
                        m.id === item.id ? { ...m, uploading: false, keys: data.keys } : m
                    ))
                }
            } catch (err) {
                console.error('Upload failed', err)
                setMedia(prev => prev.filter(m => m.id !== item.id))
            }
        }
    }

    async function handleCreateArtist() {
        if (!artistSearch) return
        try {
            // Default quick create to last_name
            const newArtist = await createArtist({ last_name: artistSearch })
            setArtists(prev => [...prev, newArtist])
            setSelectedArtist(newArtist.id)
            setArtistOpen(false)
        } catch (err) {
            console.error('Failed to create artist', err)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Object</h1>
                    <p className="text-muted-foreground">Create a new inventory record.</p>
                </div>
            </div>

            <form action={createObject} className="space-y-8">
                <input type="hidden" name="media" value={JSON.stringify(media.filter(m => m.keys))} />
                <input type="hidden" name="dimensions" value={JSON.stringify(dimensions)} />
                <input type="hidden" name="artist_id" value={selectedArtist} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Core Info */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Core Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input id="title" name="title" required placeholder="Untitled" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inventory_number">Inventory Number</Label>
                                        <Input id="inventory_number" name="inventory_number" placeholder="INV-001" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Artist</Label>
                                        <Popover open={artistOpen} onOpenChange={setArtistOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={artistOpen}
                                                    className="justify-between"
                                                >
                                                    {selectedArtist
                                                        ? (() => {
                                                            const a = artists.find((artist) => artist.id === selectedArtist)
                                                            return a ? `${a.first_name || ''} ${a.last_name || ''} ${a.company || ''}`.trim() : "Select artist..."
                                                        })()
                                                        : "Select artist..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search artist..."
                                                        value={artistSearch}
                                                        onValueChange={setArtistSearch}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start"
                                                                onClick={handleCreateArtist}
                                                            >
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create &quot;{artistSearch}&quot;
                                                            </Button>
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {artists.map((artist) => (
                                                                <CommandItem
                                                                    key={artist.id}
                                                                    value={`${artist.first_name || ''} ${artist.last_name || ''} ${artist.company || ''}`.trim()}
                                                                    onSelect={() => {
                                                                        setSelectedArtist(artist.id)
                                                                        setArtistOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedArtist === artist.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {`${artist.first_name || ''} ${artist.last_name || ''} ${artist.company || ''}`.trim()}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <CategoryPicker
                                            value={categoryId}
                                            onChange={setCategoryId}
                                            name="category_id"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Input id="year" name="year_created" type="number" placeholder="YYYY" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="date_text">Date (display)</Label>
                                        <Input id="date_text" name="date_text" placeholder="e.g., c. 1950, 1962-64" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" defaultValue="in_collection">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OBJECT_STATUSES.map(s => (
                                                    <SelectItem key={s} value={s}>{OBJECT_STATUS_LABELS[s]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="object_type">Object Type</Label>
                                        <Input id="object_type" name="object_type" placeholder="e.g., Painting, Sculpture, Print" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="medium">Medium</Label>
                                        <Input id="medium" name="medium" placeholder="e.g., Oil on canvas, Bronze" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="signature_info">Signature</Label>
                                        <Input id="signature_info" name="signature_info" placeholder="e.g., Signed lower right" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" placeholder="Physical description of the work..." />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cataloguing</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="alternate_title">Alternate Title</Label>
                                        <Input id="alternate_title" name="alternate_title" placeholder="Other title the work is known by" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="previous_id">Previous ID</Label>
                                        <Input id="previous_id" name="previous_id" placeholder="Prior inventory or accession number" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="country_of_origin">Country of Origin</Label>
                                        <Input id="country_of_origin" name="country_of_origin" placeholder="e.g., France" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="credit_line">Credit Line</Label>
                                        <Input id="credit_line" name="credit_line" placeholder="e.g., Gift of the artist" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="suite_portfolio">Suite / Portfolio</Label>
                                        <Input id="suite_portfolio" name="suite_portfolio" placeholder="Series or portfolio name" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="catalogue_raisonne">Catalogue Raisonn&eacute;</Label>
                                        <Input id="catalogue_raisonne" name="catalogue_raisonne" placeholder="Catalogue raisonn&eacute; reference" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edition_number">Edition Number</Label>
                                        <Input id="edition_number" name="edition_number" placeholder="e.g., 12/50, AP 2" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edition_size">Edition Size</Label>
                                        <Input id="edition_size" name="edition_size" type="number" placeholder="e.g., 50" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edition_type">Edition Type</Label>
                                        <Select name="edition_type">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EDITION_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Dimensions</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDimensions([...dimensions, {
                                        id: Math.random().toString(),
                                        type: 'dimensions',
                                        height: '',
                                        width: '',
                                        depth: '',
                                        unit: 'cm'
                                    }])}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {dimensions.map((dim, index) => (
                                    <div key={dim.id} className="flex items-end gap-4 p-4 border rounded-lg bg-gray-50">
                                        <div className="grid gap-2 flex-1">
                                            <Label>Type</Label>
                                            <Input
                                                value={dim.type}
                                                onChange={e => {
                                                    const newDims = [...dimensions]
                                                    newDims[index].type = e.target.value
                                                    setDimensions(newDims)
                                                }}
                                            />
                                        </div>
                                        <div className="grid gap-2 w-24">
                                            <Label>Height</Label>
                                            <Input
                                                type="number"
                                                value={dim.height}
                                                onChange={e => {
                                                    const newDims = [...dimensions]
                                                    newDims[index].height = e.target.value
                                                    setDimensions(newDims)
                                                }}
                                            />
                                        </div>
                                        <div className="grid gap-2 w-24">
                                            <Label>Width</Label>
                                            <Input
                                                type="number"
                                                value={dim.width}
                                                onChange={e => {
                                                    const newDims = [...dimensions]
                                                    newDims[index].width = e.target.value
                                                    setDimensions(newDims)
                                                }}
                                            />
                                        </div>
                                        <div className="grid gap-2 w-24">
                                            <Label>Depth</Label>
                                            <Input
                                                type="number"
                                                value={dim.depth}
                                                onChange={e => {
                                                    const newDims = [...dimensions]
                                                    newDims[index].depth = e.target.value
                                                    setDimensions(newDims)
                                                }}
                                            />
                                        </div>
                                        <div className="grid gap-2 w-20">
                                            <Label>Unit</Label>
                                            <Select
                                                value={dim.unit}
                                                onValueChange={v => {
                                                    const newDims = [...dimensions]
                                                    newDims[index].unit = v
                                                    setDimensions(newDims)
                                                }}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cm">cm</SelectItem>
                                                    <SelectItem value="in">in</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDimensions(dimensions.filter(d => d.id !== dim.id))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Condition & History</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="condition_description">Condition</Label>
                                    <Textarea id="condition_description" name="condition_description" placeholder="Current condition of the work..." rows={2} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="provenance">Provenance</Label>
                                    <Textarea id="provenance" name="provenance" placeholder="History of ownership..." rows={2} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_framed"
                                        name="is_framed"
                                        value="true"
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_framed" className="cursor-pointer">
                                        Work is framed
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Media & Location */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Current Location</Label>
                                    <LocationPicker
                                        value={locationId}
                                        onChange={setLocationId}
                                        name="location_id"
                                        className="w-full"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-xs text-muted-foreground"
                                        disabled={!permanentLocationId}
                                        onClick={() => setLocationId(permanentLocationId)}
                                    >
                                        Set to permanent location
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Permanent Location</Label>
                                    <LocationPicker
                                        value={permanentLocationId}
                                        onChange={setPermanentLocationId}
                                        name="permanent_location_id"
                                        className="w-full"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-xs text-muted-foreground"
                                        disabled={!locationId}
                                        onClick={() => setPermanentLocationId(locationId)}
                                    >
                                        Set to current location
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Media</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="media-upload" className="cursor-pointer border-2 border-dashed rounded-lg p-6 hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                                        <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                        <span className="text-sm font-medium">Click to upload images</span>
                                        <span className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP</span>
                                        <Input
                                            id="media-upload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </Label>
                                </div>

                                <div className="space-y-4">
                                    {media.map((item, index) => (
                                        <div key={item.id} className="flex gap-4 p-3 border rounded-lg bg-white relative group">
                                            <div className="h-20 w-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden relative">
                                                {item.uploading ? (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={URL.createObjectURL(item.file)}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2 min-w-0">
                                                <Input
                                                    value={item.name}
                                                    onChange={e => {
                                                        const newMedia = [...media]
                                                        newMedia[index].name = e.target.value
                                                        setMedia(newMedia)
                                                    }}
                                                    className="h-8 text-sm"
                                                    placeholder="Image name"
                                                />
                                                <Input
                                                    value={item.description}
                                                    onChange={e => {
                                                        const newMedia = [...media]
                                                        newMedia[index].description = e.target.value
                                                        setMedia(newMedia)
                                                    }}
                                                    className="h-8 text-sm"
                                                    placeholder="Description"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="primary_image"
                                                        checked={item.is_primary}
                                                        onChange={() => {
                                                            setMedia(media.map(m => ({ ...m, is_primary: m.id === item.id })))
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="text-xs text-muted-foreground">Primary Image</span>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setMedia(media.filter(m => m.id !== item.id))}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button">Cancel</Button>
                    <SubmitButton />
                </div>
            </form>
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Creating Object...' : 'Create Object'}
        </Button>
    )
}
