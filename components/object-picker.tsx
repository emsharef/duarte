'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, X, Package, ChevronDown, ChevronUp } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { getObjectsForSelection, ObjectForSelection } from '@/app/dashboard/objects/actions'

export type SelectedObject = {
    id: string
    title: string
    artist_name?: string
    price?: number
    discount?: number
    buyer_premium?: number
    taxes?: number
    lot_number?: string
}

type ObjectPickerProps = {
    selectedObjects: SelectedObject[]
    onSelectionChange: (objects: SelectedObject[]) => void
    showFinancialFields?: boolean
    label?: string
    currency?: string
}

export function ObjectPicker({
    selectedObjects,
    onSelectionChange,
    showFinancialFields = false,
    label = 'Objects',
    currency = 'USD'
}: ObjectPickerProps) {
    const [open, setOpen] = useState(false)
    const [objects, setObjects] = useState<ObjectForSelection[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set())

    useEffect(() => {
        getObjectsForSelection().then((data) => {
            setObjects(data)
            setLoading(false)
        })
    }, [])

    const handleSelect = (obj: ObjectForSelection) => {
        const isSelected = selectedObjects.some(s => s.id === obj.id)
        if (isSelected) {
            onSelectionChange(selectedObjects.filter(s => s.id !== obj.id))
        } else {
            onSelectionChange([...selectedObjects, {
                id: obj.id,
                title: obj.title,
                artist_name: obj.artist_name
            }])
        }
    }

    const handleRemove = (id: string) => {
        onSelectionChange(selectedObjects.filter(s => s.id !== id))
        setExpandedObjects(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }

    const handleFieldChange = (id: string, field: keyof SelectedObject, value: number | string | undefined) => {
        onSelectionChange(selectedObjects.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ))
    }

    const toggleExpanded = (id: string) => {
        setExpandedObjects(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const availableObjects = objects.filter(
        obj => !selectedObjects.some(s => s.id === obj.id)
    )

    // Calculate line total for an object
    const calculateLineTotal = (obj: SelectedObject): number => {
        const price = obj.price || 0
        const discount = obj.discount || 0
        const premium = obj.buyer_premium || 0
        const taxes = obj.taxes || 0
        return price - discount + premium + taxes
    }

    // Calculate grand total
    const grandTotal = selectedObjects.reduce((sum, obj) => sum + calculateLineTotal(obj), 0)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{label}</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Add Object
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Search objects..." />
                            <CommandList>
                                <CommandEmpty>
                                    {loading ? 'Loading...' : 'No objects found.'}
                                </CommandEmpty>
                                <CommandGroup>
                                    {availableObjects.map((obj) => (
                                        <CommandItem
                                            key={obj.id}
                                            value={`${obj.title} ${obj.artist_name || ''} ${obj.inventory_number || ''}`}
                                            onSelect={() => {
                                                handleSelect(obj)
                                                setOpen(false)
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{obj.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {obj.artist_name}
                                                    {obj.inventory_number && ` • ${obj.inventory_number}`}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedObjects.length === 0 ? (
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                    No objects selected
                </div>
            ) : (
                <div className="space-y-2">
                    {selectedObjects.map((obj) => {
                        const isExpanded = expandedObjects.has(obj.id)
                        const lineTotal = calculateLineTotal(obj)

                        return (
                            <div
                                key={obj.id}
                                className="border rounded-lg bg-gray-50 overflow-hidden"
                            >
                                {/* Header row */}
                                <div className="flex items-center gap-3 p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{obj.title}</p>
                                        {obj.artist_name && (
                                            <p className="text-xs text-muted-foreground">{obj.artist_name}</p>
                                        )}
                                    </div>

                                    {showFinancialFields ? (
                                        <>
                                            <div className="w-28">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Price"
                                                    value={obj.price || ''}
                                                    onChange={(e) => handleFieldChange(
                                                        obj.id,
                                                        'price',
                                                        e.target.value ? parseFloat(e.target.value) : undefined
                                                    )}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => toggleExpanded(obj.id)}
                                            >
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </>
                                    ) : null}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleRemove(obj.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Expanded fields */}
                                {showFinancialFields && isExpanded && (
                                    <div className="border-t bg-white p-3 space-y-3">
                                        <div className="grid grid-cols-4 gap-3">
                                            <div>
                                                <Label className="text-xs">Discount</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={obj.discount || ''}
                                                    onChange={(e) => handleFieldChange(
                                                        obj.id,
                                                        'discount',
                                                        e.target.value ? parseFloat(e.target.value) : undefined
                                                    )}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Buyer Premium</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={obj.buyer_premium || ''}
                                                    onChange={(e) => handleFieldChange(
                                                        obj.id,
                                                        'buyer_premium',
                                                        e.target.value ? parseFloat(e.target.value) : undefined
                                                    )}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Taxes</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={obj.taxes || ''}
                                                    onChange={(e) => handleFieldChange(
                                                        obj.id,
                                                        'taxes',
                                                        e.target.value ? parseFloat(e.target.value) : undefined
                                                    )}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Lot #</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Lot 123"
                                                    value={obj.lot_number || ''}
                                                    onChange={(e) => handleFieldChange(
                                                        obj.id,
                                                        'lot_number',
                                                        e.target.value || undefined
                                                    )}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end text-sm">
                                            <span className="text-muted-foreground mr-2">Line Total:</span>
                                            <span className="font-medium">{formatCurrency(lineTotal)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {/* Grand Total */}
                    {showFinancialFields && selectedObjects.length > 0 && (
                        <div className="flex justify-end pt-2 border-t">
                            <span className="text-sm text-muted-foreground mr-2">Total:</span>
                            <span className="text-sm font-semibold">{formatCurrency(grandTotal)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
