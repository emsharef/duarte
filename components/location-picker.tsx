'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getLocations, createLocation, Location } from '@/app/actions/locations'
import { LOCATION_TYPES } from '@/lib/constants'

type LocationPickerProps = {
    value?: string
    onChange: (locationId: string | undefined) => void
    placeholder?: string
    className?: string
    name?: string
}

export function LocationPicker({
    value,
    onChange,
    placeholder = 'Select location...',
    className,
    name
}: LocationPickerProps) {
    const [open, setOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)

    // New location form state
    const [newLocation, setNewLocation] = useState({
        name: '',
        type: '',
        parent_id: ''
    })

    useEffect(() => {
        loadLocations()
    }, [])

    async function loadLocations() {
        setLoading(true)
        const data = await getLocations()
        setLocations(data)
        setLoading(false)
    }

    const selectedLocation = locations.find(l => l.id === value)

    // Build display name with parent hierarchy
    function getDisplayName(location: Location): string {
        if (location.parent_id) {
            const parent = locations.find(l => l.id === location.parent_id)
            if (parent) {
                return `${parent.name} > ${location.name}`
            }
        }
        return location.name
    }

    async function handleCreate() {
        if (!newLocation.name.trim()) {
            return
        }

        setCreating(true)
        try {
            const location = await createLocation({
                name: newLocation.name,
                type: newLocation.type || undefined,
                parent_id: newLocation.parent_id || undefined,
            })

            setLocations(prev => [...prev, location].sort((a, b) =>
                a.name.localeCompare(b.name)
            ))
            onChange(location.id)
            setDialogOpen(false)
            setOpen(false)
            resetNewLocation()
        } catch (err) {
            console.error('Failed to create location:', err)
        } finally {
            setCreating(false)
        }
    }

    function resetNewLocation() {
        setNewLocation({
            name: '',
            type: '',
            parent_id: ''
        })
    }

    function handleQuickCreate() {
        // Pre-fill the search text as location name
        if (search) {
            setNewLocation(prev => ({
                ...prev,
                name: search
            }))
        }
        setDialogOpen(true)
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("justify-between", className)}
                    >
                        {selectedLocation ? getDisplayName(selectedLocation) : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search locations..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {loading ? (
                                    <span className="text-sm text-muted-foreground">Loading...</span>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={handleQuickCreate}
                                    >
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Create new location{search && ` "${search}"`}
                                    </Button>
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {/* Option to clear selection */}
                                {value && (
                                    <CommandItem
                                        value="__clear__"
                                        onSelect={() => {
                                            onChange(undefined)
                                            setOpen(false)
                                        }}
                                    >
                                        <span className="text-muted-foreground">Clear selection</span>
                                    </CommandItem>
                                )}
                                {/* Create new option at top */}
                                <CommandItem
                                    value="__create__"
                                    onSelect={handleQuickCreate}
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Create new location...
                                </CommandItem>
                                {/* Existing locations */}
                                {locations.map((location) => (
                                    <CommandItem
                                        key={location.id}
                                        value={getDisplayName(location)}
                                        onSelect={() => {
                                            onChange(location.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === location.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{getDisplayName(location)}</span>
                                            {location.type && (
                                                <span className="text-xs text-muted-foreground">
                                                    {location.type}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Hidden input for form submission */}
            {name && <input type="hidden" name={name} value={value || ''} />}

            {/* Create Location Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Location</DialogTitle>
                        <DialogDescription>
                            Add a new location for storing or displaying objects.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="location_name">Location Name *</Label>
                            <Input
                                id="location_name"
                                value={newLocation.name}
                                onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Main Gallery, Storage Room A"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location_type">Type</Label>
                            <Select
                                value={newLocation.type}
                                onValueChange={(val) => setNewLocation(prev => ({ ...prev, type: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCATION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="parent_location">Parent Location</Label>
                            <Select
                                value={newLocation.parent_id}
                                onValueChange={(val) => setNewLocation(prev => ({ ...prev, parent_id: val === 'none' ? '' : val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="None (top level)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (top level)</SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating || !newLocation.name.trim()}>
                            {creating ? 'Creating...' : 'Create Location'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
