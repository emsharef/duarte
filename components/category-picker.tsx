'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Tag } from 'lucide-react'
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getCategories, createCategory, Category } from '@/app/actions/categories'

type CategoryPickerProps = {
    value?: string
    onChange: (categoryId: string | undefined) => void
    placeholder?: string
    className?: string
    name?: string
}

export function CategoryPicker({
    value,
    onChange,
    placeholder = 'Select category...',
    className,
    name
}: CategoryPickerProps) {
    const [open, setOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)

    // New category form state
    const [newCategoryName, setNewCategoryName] = useState('')

    useEffect(() => {
        loadCategories()
    }, [])

    async function loadCategories() {
        setLoading(true)
        const data = await getCategories()
        setCategories(data)
        setLoading(false)
    }

    const selectedCategory = categories.find(c => c.id === value)

    async function handleCreate() {
        if (!newCategoryName.trim()) {
            return
        }

        setCreating(true)
        try {
            const category = await createCategory({ name: newCategoryName.trim() })

            setCategories(prev => [...prev, category].sort((a, b) =>
                a.name.localeCompare(b.name)
            ))
            onChange(category.id)
            setDialogOpen(false)
            setOpen(false)
            setNewCategoryName('')
        } catch (err) {
            console.error('Failed to create category:', err)
        } finally {
            setCreating(false)
        }
    }

    function handleQuickCreate() {
        // Pre-fill the search text as category name
        if (search) {
            setNewCategoryName(search)
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
                        {selectedCategory?.name || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search categories..."
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
                                        <Tag className="mr-2 h-4 w-4" />
                                        Create new category{search && ` "${search}"`}
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
                                    <Tag className="mr-2 h-4 w-4" />
                                    Create new category...
                                </CommandItem>
                                {/* Existing categories */}
                                {categories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                            onChange(category.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Hidden input for form submission */}
            {name && <input type="hidden" name={name} value={value || ''} />}

            {/* Create Category Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category_name">Category Name *</Label>
                            <Input
                                id="category_name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g., Painting, Sculpture, Print"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleCreate()
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating || !newCategoryName.trim()}>
                            {creating ? 'Creating...' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
