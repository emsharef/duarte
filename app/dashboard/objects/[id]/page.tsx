'use client'

import { useState, useEffect, use } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
    Plus, X, Loader2, Check, ChevronsUpDown, ArrowLeft, Trash2, Pencil,
    MapPin, Tag, FileText, Upload, ShoppingCart, ArrowLeftRight, Shield,
    DollarSign, Receipt, Calendar, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { getObjectWithRelations, updateObject, deleteObject, getCategories, ObjectWithRelations } from '../actions'
import { getArtists, createArtist } from '@/app/actions/artists'
import { LocationPicker } from '@/components/location-picker'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Dimension = {
    id: string
    type: string
    height: string
    width: string
    depth: string
    unit: string
}

type NewMediaItem = {
    id: string
    file: File
    name: string
    description: string
    is_primary: boolean
    uploading: boolean
    keys?: { original: string; medium: string; thumbnail: string }
}

// Helper to format contact name
function formatContactName(contact?: { first_name?: string; last_name?: string; display_name?: string }): string {
    if (!contact) return 'Unknown'
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    return name || contact.display_name || 'Unknown'
}

// Helper to format currency
function formatCurrency(amount?: number, currency: string = 'USD'): string {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

// Helper to format date
function formatDate(date?: string): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ObjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [object, setObject] = useState<ObjectWithRelations | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [dimensions, setDimensions] = useState<Dimension[]>([])
    const [artists, setArtists] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [selectedLocation, setSelectedLocation] = useState<string | undefined>()
    const [selectedArtist, setSelectedArtist] = useState<string>('')
    const [artistSearch, setArtistSearch] = useState('')
    const [artistOpen, setArtistOpen] = useState(false)
    const [newMedia, setNewMedia] = useState<NewMediaItem[]>([])

    useEffect(() => {
        async function loadData() {
            const [obj, artistList, categoryList] = await Promise.all([
                getObjectWithRelations(id),
                getArtists(),
                getCategories(),
            ])

            if (obj) {
                setObject(obj)
                setSelectedArtist(obj.artist_id || '')
                setSelectedLocation(obj.location_id || undefined)
                if (obj.object_dimensions && obj.object_dimensions.length > 0) {
                    setDimensions(obj.object_dimensions.map(d => ({
                        id: d.id,
                        type: d.type || 'dimensions',
                        height: d.height?.toString() || '',
                        width: d.width?.toString() || '',
                        depth: d.depth?.toString() || '',
                        unit: d.unit || 'cm',
                    })))
                } else {
                    setDimensions([{ id: '1', type: 'dimensions', height: '', width: '', depth: '', unit: 'cm' }])
                }
            }
            setArtists(artistList)
            setCategories(categoryList)
            setLoading(false)
        }
        loadData()
    }, [id])

    async function handleCreateArtist() {
        if (!artistSearch) return
        try {
            const newArtist = await createArtist({ last_name: artistSearch })
            setArtists(prev => [...prev, newArtist])
            setSelectedArtist(newArtist.id)
            setArtistOpen(false)
        } catch (err) {
            console.error('Failed to create artist', err)
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this object? This action cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteObject(id)
        } catch (err) {
            console.error('Failed to delete:', err)
            setDeleting(false)
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return

        const existingMediaCount = object?.object_media?.length || 0
        const newFiles = Array.from(e.target.files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name.split('.')[0],
            description: '',
            is_primary: existingMediaCount === 0 && newMedia.length === 0,
            uploading: true
        }))

        setNewMedia(prev => [...prev, ...newFiles])

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
                    setNewMedia(prev => prev.map(m =>
                        m.id === item.id ? { ...m, uploading: false, keys: data.keys } : m
                    ))
                }
            } catch (err) {
                console.error('Upload failed', err)
                setNewMedia(prev => prev.filter(m => m.id !== item.id))
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!object) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Object not found</h2>
                <Link href="/dashboard">
                    <Button variant="link">Return to Inventory</Button>
                </Link>
            </div>
        )
    }

    const artistName = object.artists
        ? `${object.artists.first_name || ''} ${object.artists.last_name || ''}`.trim() || object.artists.company || 'Unknown Artist'
        : 'Unknown Artist'

    const primaryMedia = object.object_media?.find(m => m.is_primary) || object.object_media?.[0]
    const locationName = object.locations?.name
    const categoryName = object.categories?.name

    // Format dimensions for display
    const dimensionDisplay = object.object_dimensions?.map(d => {
        const parts = []
        if (d.height) parts.push(`${d.height}`)
        if (d.width) parts.push(`${d.width}`)
        if (d.depth) parts.push(`${d.depth}`)
        return parts.length > 0 ? `${parts.join(' × ')} ${d.unit || 'cm'}` : null
    }).filter(Boolean).join(', ')

    // Get current/active loan
    const activeLoan = object.loans?.find(l => l.loan?.status === 'Active')

    // Get latest valuation
    const latestValuation = object.valuations?.[0]

    // Get active insurance
    const activeInsurance = object.insurance?.find(i => {
        if (!i.policy?.end_date) return true
        return new Date(i.policy.end_date) > new Date()
    })

    // Get acquisition
    const acquisition = object.acquisitions?.[0]

    // Calculate total expenses
    const totalExpenses = object.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    // VIEW MODE
    if (!isEditing) {
        return (
            <div className="max-w-6xl mx-auto pb-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Inventory
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Image and Basic Info */}
                    <div className="lg:col-span-1">
                        {/* Image */}
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                            {primaryMedia?.signed_url ? (
                                <img
                                    src={primaryMedia.signed_url}
                                    alt={object.title}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <FileText className="h-16 w-16 mx-auto mb-2 opacity-50" />
                                        <p>No image available</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail gallery */}
                        {object.object_media && object.object_media.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {object.object_media.map((media, idx) => (
                                    <div
                                        key={media.id}
                                        className={cn(
                                            "aspect-square rounded-md overflow-hidden border-2 cursor-pointer",
                                            media.is_primary ? "border-blue-500" : "border-transparent hover:border-gray-300"
                                        )}
                                    >
                                        {media.signed_url && (
                                            <img
                                                src={media.signed_url}
                                                alt={media.name || `Image ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details and Tabs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title and Artist */}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-1">{object.title}</h1>
                            {object.artists && (
                                <Link href={`/dashboard/artists`} className="text-xl text-muted-foreground hover:underline">
                                    {artistName}
                                </Link>
                            )}
                            {object.year_created && (
                                <p className="text-lg text-muted-foreground">{object.year_created}</p>
                            )}
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-2 flex-wrap">
                            {object.status && (
                                <Badge variant={object.status === 'Available' ? 'default' : object.status === 'Sold' ? 'secondary' : 'outline'}>
                                    {object.status}
                                </Badge>
                            )}
                            {activeLoan && (
                                <Badge variant="outline" className="bg-yellow-50">
                                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                                    On Loan
                                </Badge>
                            )}
                            {activeInsurance && (
                                <Badge variant="outline" className="bg-green-50">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Insured
                                </Badge>
                            )}
                            {object.inventory_number && (
                                <Badge variant="outline">{object.inventory_number}</Badge>
                            )}
                            {categoryName && (
                                <Badge variant="outline">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {categoryName}
                                </Badge>
                            )}
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="documents">
                                    Documents {object.documents && object.documents.length > 0 && `(${object.documents.length})`}
                                </TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                                <TabsTrigger value="financials">Financials</TabsTrigger>
                            </TabsList>

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="space-y-6 mt-6">
                                {/* Key Details Grid */}
                                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                                    {object.medium && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Medium</p>
                                            <p className="font-medium">{object.medium}</p>
                                        </div>
                                    )}
                                    {object.object_type && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Type</p>
                                            <p className="font-medium">{object.object_type}</p>
                                        </div>
                                    )}
                                    {dimensionDisplay && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Dimensions</p>
                                            <p className="font-medium">{dimensionDisplay}</p>
                                        </div>
                                    )}
                                    {object.edition && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Edition</p>
                                            <p className="font-medium">{object.edition}</p>
                                        </div>
                                    )}
                                    {object.signature_info && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Signature</p>
                                            <p className="font-medium">{object.signature_info}</p>
                                        </div>
                                    )}
                                    {locationName && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium flex items-center">
                                                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                                {locationName}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {object.description && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Description</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{object.description}</p>
                                    </div>
                                )}

                                {/* Provenance */}
                                {object.provenance && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Provenance</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{object.provenance}</p>
                                    </div>
                                )}

                                {/* Acquisition */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold">Acquisition</h3>
                                        <Link href={acquisition ? `/dashboard/acquisitions/${acquisition.acquisition?.id}` : `/dashboard/acquisitions/new?object=${id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                                {acquisition ? <ExternalLink className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                            </Button>
                                        </Link>
                                    </div>
                                    {acquisition ? (
                                        <div className="text-sm space-y-1">
                                            {acquisition.acquisition?.acquisition_subject && (
                                                <p className="font-medium">{acquisition.acquisition.acquisition_subject}</p>
                                            )}
                                            <div className="text-muted-foreground space-y-0.5">
                                                {acquisition.acquisition?.acquired_from && (
                                                    <p>From {formatContactName(acquisition.acquisition.acquired_from)}</p>
                                                )}
                                                {acquisition.acquisition?.acquisition_date && (
                                                    <p>{formatDate(acquisition.acquisition.acquisition_date)}{acquisition.lot_number && ` · Lot ${acquisition.lot_number}`}</p>
                                                )}
                                                {acquisition.object_price != null && (
                                                    <div className="pt-1">
                                                        <p>Price: {formatCurrency(acquisition.object_price, acquisition.acquisition?.currency)}</p>
                                                        {(acquisition.discount != null && acquisition.discount > 0) && (
                                                            <p className="text-green-600">Discount: -{formatCurrency(acquisition.discount, acquisition.acquisition?.currency)}</p>
                                                        )}
                                                        {(acquisition.buyer_premium != null && acquisition.buyer_premium > 0) && (
                                                            <p>Premium: +{formatCurrency(acquisition.buyer_premium, acquisition.acquisition?.currency)}</p>
                                                        )}
                                                        {(acquisition.taxes != null && acquisition.taxes > 0) && (
                                                            <p>Taxes: +{formatCurrency(acquisition.taxes, acquisition.acquisition?.currency)}</p>
                                                        )}
                                                        {((acquisition.discount ?? 0) > 0 || (acquisition.buyer_premium ?? 0) > 0 || (acquisition.taxes ?? 0) > 0) && (
                                                            <p className="font-medium text-foreground pt-0.5">
                                                                Total: {formatCurrency(
                                                                    (acquisition.object_price || 0) - (acquisition.discount || 0) + (acquisition.buyer_premium || 0) + (acquisition.taxes || 0),
                                                                    acquisition.acquisition?.currency
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Not recorded</p>
                                    )}
                                </div>

                                {/* Loan */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold">Loan</h3>
                                        <Link href={activeLoan ? `/dashboard/loans` : `/dashboard/loans/new?object=${id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                                {activeLoan ? <ExternalLink className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                            </Button>
                                        </Link>
                                    </div>
                                    {activeLoan ? (
                                        <p className="text-muted-foreground">
                                            {activeLoan.loan?.direction === 'out' ? 'Loaned to' : 'Borrowed from'}{' '}
                                            {formatContactName(activeLoan.loan?.direction === 'out' ? activeLoan.loan?.borrower : activeLoan.loan?.lender)}
                                            {activeLoan.loan?.end_date && ` · Due ${formatDate(activeLoan.loan.end_date)}`}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground">Not on loan</p>
                                    )}
                                </div>

                                {/* Insurance */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold">Insurance</h3>
                                        <Link href={activeInsurance ? `/dashboard/insurance` : `/dashboard/insurance/new?object=${id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                                {activeInsurance ? <ExternalLink className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                            </Button>
                                        </Link>
                                    </div>
                                    {activeInsurance ? (
                                        <p className="text-muted-foreground">
                                            {activeInsurance.policy?.provider || formatContactName(activeInsurance.policy?.insurer)}
                                            {activeInsurance.insured_value && ` · ${formatCurrency(activeInsurance.insured_value)}`}
                                            {activeInsurance.policy?.end_date && ` · Expires ${formatDate(activeInsurance.policy.end_date)}`}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground">Not insured</p>
                                    )}
                                </div>

                                {/* Valuation */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold">Valuation</h3>
                                        <Link href={latestValuation ? `/dashboard/valuations` : `/dashboard/valuations/new?object=${id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                                {latestValuation ? <ExternalLink className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                            </Button>
                                        </Link>
                                    </div>
                                    {latestValuation ? (
                                        <p className="text-muted-foreground">
                                            {formatCurrency(latestValuation.appraised_value, latestValuation.valuation?.currency)}
                                            {latestValuation.valuation?.appraiser && ` · ${formatContactName(latestValuation.valuation.appraiser)}`}
                                            {latestValuation.valuation?.valuation_date && ` · ${formatDate(latestValuation.valuation.valuation_date)}`}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground">No valuation recorded</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* DOCUMENTS TAB */}
                            <TabsContent value="documents" className="space-y-4 mt-6">
                                {object.documents && object.documents.length > 0 ? (
                                    <div className="space-y-2">
                                        {object.documents.map((doc) => (
                                            <Card key={doc.id} className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-8 w-8 text-blue-500" />
                                                        <div>
                                                            <p className="font-medium">{doc.document?.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {doc.document?.document_type} • {formatDate(doc.document?.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="p-8 text-center border-dashed">
                                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="font-medium mb-1">No Documents</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Upload certificates, invoices, condition reports, and more.
                                        </p>
                                        <Link href={`/dashboard/documents/new?entity_type=object&entity_id=${id}`}>
                                            <Button variant="outline">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload Document
                                            </Button>
                                        </Link>
                                    </Card>
                                )}

                                {object.documents && object.documents.length > 0 && (
                                    <Link href={`/dashboard/documents/new?entity_type=object&entity_id=${id}`}>
                                        <Button variant="outline" className="w-full">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Document
                                        </Button>
                                    </Link>
                                )}
                            </TabsContent>

                            {/* HISTORY TAB */}
                            <TabsContent value="history" className="space-y-4 mt-6">
                                <div className="space-y-4">
                                    {/* Loan History */}
                                    {object.loans && object.loans.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <ArrowLeftRight className="h-4 w-4" />
                                                Loan History ({object.loans.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {object.loans.map((loan) => (
                                                    <Card key={loan.id} className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium">
                                                                    {loan.loan?.direction === 'out' ? 'Loaned to' : 'Borrowed from'}{' '}
                                                                    {formatContactName(loan.loan?.direction === 'out' ? loan.loan?.borrower : loan.loan?.lender)}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {formatDate(loan.loan?.start_date)} - {formatDate(loan.loan?.end_date)}
                                                                </p>
                                                            </div>
                                                            <Badge variant={loan.loan?.status === 'Active' ? 'default' : 'secondary'}>
                                                                {loan.loan?.status}
                                                            </Badge>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Exhibition History */}
                                    {object.exhibition_history && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Exhibition History</h3>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{object.exhibition_history}</p>
                                        </div>
                                    )}

                                    {/* Condition */}
                                    {object.condition_description && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Condition</h3>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{object.condition_description}</p>
                                        </div>
                                    )}

                                    {!object.loans?.length && !object.exhibition_history && !object.condition_description && (
                                        <Card className="p-8 text-center border-dashed">
                                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                            <h3 className="font-medium mb-1">No History Yet</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Loan and exhibition history will appear here.
                                            </p>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>

                            {/* FINANCIALS TAB */}
                            <TabsContent value="financials" className="space-y-6 mt-6">
                                {/* Valuations */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Valuations
                                        </h3>
                                        <Link href={`/dashboard/valuations/new?object=${id}`}>
                                            <Button variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </Link>
                                    </div>
                                    {object.valuations && object.valuations.length > 0 ? (
                                        <div className="space-y-2">
                                            {object.valuations.map((val) => (
                                                <Card key={val.id} className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{formatCurrency(val.appraised_value, val.valuation?.currency)}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatContactName(val.valuation?.appraiser)} • {formatDate(val.valuation?.valuation_date)}
                                                            </p>
                                                            {val.valuation?.purpose && (
                                                                <Badge variant="outline" className="mt-1">{val.valuation.purpose}</Badge>
                                                            )}
                                                        </div>
                                                        {val.low_estimate && val.high_estimate && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Est: {formatCurrency(val.low_estimate)} - {formatCurrency(val.high_estimate)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="p-6 text-center border-dashed">
                                            <p className="text-sm text-muted-foreground">No valuations recorded</p>
                                        </Card>
                                    )}
                                </div>

                                {/* Expenses */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            Expenses
                                            {totalExpenses > 0 && (
                                                <Badge variant="secondary">{formatCurrency(totalExpenses)}</Badge>
                                            )}
                                        </h3>
                                        <Link href={`/dashboard/expenses/new?object=${id}`}>
                                            <Button variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </Link>
                                    </div>
                                    {object.expenses && object.expenses.length > 0 ? (
                                        <div className="space-y-2">
                                            {object.expenses.map((expense) => (
                                                <Card key={expense.id} className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{expense.expense_type}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatContactName(expense.vendor)} • {formatDate(expense.expense_date)}
                                                            </p>
                                                        </div>
                                                        <p className="font-medium">{formatCurrency(expense.amount, expense.currency)}</p>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="p-6 text-center border-dashed">
                                            <p className="text-sm text-muted-foreground">No expenses recorded</p>
                                        </Card>
                                    )}
                                </div>

                                {/* Insurance Policies */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Insurance
                                        </h3>
                                        <Link href={`/dashboard/insurance/new?object=${id}`}>
                                            <Button variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </Link>
                                    </div>
                                    {object.insurance && object.insurance.length > 0 ? (
                                        <div className="space-y-2">
                                            {object.insurance.map((ins) => (
                                                <Card key={ins.id} className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{ins.policy?.provider || formatContactName(ins.policy?.insurer)}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Policy #{ins.policy?.policy_number} • {ins.policy?.coverage_type}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatDate(ins.policy?.start_date)} - {formatDate(ins.policy?.end_date)}
                                                            </p>
                                                        </div>
                                                        <p className="font-medium">{formatCurrency(ins.insured_value)}</p>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="p-6 text-center border-dashed">
                                            <p className="text-sm text-muted-foreground">No insurance policies</p>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        )
    }

    // EDIT MODE
    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit {object.title}</h1>
                        <p className="text-muted-foreground">{artistName} {object.year_created && `• ${object.year_created}`}</p>
                    </div>
                </div>
            </div>

            <form action={(formData) => updateObject(id, formData)} className="space-y-8">
                <input type="hidden" name="dimensions" value={JSON.stringify(dimensions)} />
                <input type="hidden" name="artist_id" value={selectedArtist} />
                <input type="hidden" name="new_media" value={JSON.stringify(newMedia.filter(m => m.keys))} />

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
                                        <Input id="title" name="title" required defaultValue={object.title} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inventory_number">Inventory Number</Label>
                                        <Input id="inventory_number" name="inventory_number" defaultValue={object.inventory_number || ''} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Artist</Label>
                                        <Popover open={artistOpen} onOpenChange={setArtistOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className="justify-between">
                                                    {selectedArtist
                                                        ? (() => {
                                                            const a = artists.find((artist) => artist.id === selectedArtist)
                                                            return a ? `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.company : "Select artist..."
                                                        })()
                                                        : "Select artist..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search artist..." value={artistSearch} onValueChange={setArtistSearch} />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            <Button variant="ghost" className="w-full justify-start" onClick={handleCreateArtist}>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create "{artistSearch}"
                                                            </Button>
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {artists.map((artist) => (
                                                                <CommandItem
                                                                    key={artist.id}
                                                                    value={`${artist.first_name || ''} ${artist.last_name || ''}`.trim() || artist.company}
                                                                    onSelect={() => { setSelectedArtist(artist.id); setArtistOpen(false) }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", selectedArtist === artist.id ? "opacity-100" : "opacity-0")} />
                                                                    {`${artist.first_name || ''} ${artist.last_name || ''}`.trim() || artist.company}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Input id="year" name="year_created" type="number" defaultValue={object.year_created || ''} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select name="category_id" defaultValue={object.category_id || ''}>
                                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" defaultValue={object.status || 'Available'}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Available">Available</SelectItem>
                                                <SelectItem value="Sold">Sold</SelectItem>
                                                <SelectItem value="Loaned">Loaned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="object_type">Object Type</Label>
                                        <Input id="object_type" name="object_type" defaultValue={object.object_type || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="medium">Medium</Label>
                                        <Input id="medium" name="medium" defaultValue={object.medium || ''} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edition">Edition</Label>
                                        <Input id="edition" name="edition" defaultValue={object.edition || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="signature_info">Signature</Label>
                                        <Input id="signature_info" name="signature_info" defaultValue={object.signature_info || ''} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" defaultValue={object.description || ''} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Dimensions</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={() => setDimensions([...dimensions, { id: Math.random().toString(), type: 'dimensions', height: '', width: '', depth: '', unit: 'cm' }])}>
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {dimensions.map((dim, index) => (
                                    <div key={dim.id} className="flex items-end gap-4 p-4 border rounded-lg bg-gray-50">
                                        <div className="grid gap-2 flex-1">
                                            <Label>Type</Label>
                                            <Input value={dim.type} onChange={e => { const newDims = [...dimensions]; newDims[index].type = e.target.value; setDimensions(newDims) }} />
                                        </div>
                                        <div className="grid gap-2 w-20">
                                            <Label>H</Label>
                                            <Input type="number" value={dim.height} onChange={e => { const newDims = [...dimensions]; newDims[index].height = e.target.value; setDimensions(newDims) }} />
                                        </div>
                                        <div className="grid gap-2 w-20">
                                            <Label>W</Label>
                                            <Input type="number" value={dim.width} onChange={e => { const newDims = [...dimensions]; newDims[index].width = e.target.value; setDimensions(newDims) }} />
                                        </div>
                                        <div className="grid gap-2 w-20">
                                            <Label>D</Label>
                                            <Input type="number" value={dim.depth} onChange={e => { const newDims = [...dimensions]; newDims[index].depth = e.target.value; setDimensions(newDims) }} />
                                        </div>
                                        <div className="grid gap-2 w-20">
                                            <Label>Unit</Label>
                                            <Select value={dim.unit} onValueChange={v => { const newDims = [...dimensions]; newDims[index].unit = v; setDimensions(newDims) }}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cm">cm</SelectItem>
                                                    <SelectItem value="in">in</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setDimensions(dimensions.filter(d => d.id !== dim.id))}>
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
                                    <Textarea id="condition_description" name="condition_description" defaultValue={object.condition_description || ''} rows={2} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="provenance">Provenance</Label>
                                    <Textarea id="provenance" name="provenance" defaultValue={object.provenance || ''} rows={2} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="exhibition_history">Exhibition History</Label>
                                    <Textarea id="exhibition_history" name="exhibition_history" defaultValue={object.exhibition_history || ''} rows={2} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="is_framed" name="is_framed" value="true" defaultChecked={object.is_framed} className="h-4 w-4 rounded border-gray-300" />
                                    <Label htmlFor="is_framed" className="cursor-pointer">Work is framed</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <LocationPicker
                                    value={selectedLocation}
                                    onChange={setSelectedLocation}
                                    placeholder="Select location..."
                                    name="location_id"
                                    className="w-full"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Existing images */}
                                {object.object_media && object.object_media.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {object.object_media.map((media) => (
                                            <div key={media.id} className={cn("relative rounded-lg overflow-hidden border-2", media.is_primary ? "border-blue-500" : "border-transparent")}>
                                                {media.signed_url && (
                                                    <img src={media.signed_url} alt={media.name || ''} className="w-full h-24 object-cover" />
                                                )}
                                                {media.is_primary && (
                                                    <span className="absolute top-1 left-1 text-xs bg-blue-500 text-white px-1 rounded">Primary</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload new images */}
                                <Label htmlFor="media-upload" className="cursor-pointer border-2 border-dashed rounded-lg p-4 hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                                    <Upload className="h-6 w-6 mb-2 text-gray-400" />
                                    <span className="text-sm font-medium">Add images</span>
                                    <span className="text-xs text-muted-foreground">JPG, PNG, WEBP</span>
                                    <Input
                                        id="media-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </Label>

                                {/* Newly uploaded images */}
                                {newMedia.length > 0 && (
                                    <div className="space-y-2">
                                        {newMedia.map((item, index) => (
                                            <div key={item.id} className="flex gap-3 p-2 border rounded-lg bg-white relative group">
                                                <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden relative">
                                                    {item.uploading ? (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={URL.createObjectURL(item.file)}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Input
                                                        value={item.name}
                                                        onChange={e => {
                                                            const updated = [...newMedia]
                                                            updated[index].name = e.target.value
                                                            setNewMedia(updated)
                                                        }}
                                                        className="h-7 text-sm mb-1"
                                                        placeholder="Name"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="new_primary_image"
                                                            checked={item.is_primary}
                                                            onChange={() => {
                                                                setNewMedia(newMedia.map(m => ({ ...m, is_primary: m.id === item.id })))
                                                            }}
                                                            className="h-3 w-3"
                                                        />
                                                        <span className="text-xs text-muted-foreground">Primary</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                    onClick={() => setNewMedia(newMedia.filter(m => m.id !== item.id))}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-between">
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? 'Deleting...' : 'Delete Object'}
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <SubmitButton />
                    </div>
                </div>
            </form>
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Saving...' : 'Save Changes'}
        </Button>
    )
}
