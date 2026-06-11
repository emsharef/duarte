'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, UserPlus } from 'lucide-react'
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
import { getContacts, createContact, Contact } from '@/app/actions/contacts'
import { CONTACT_TYPES } from '@/lib/constants'

type ContactPickerProps = {
    value?: string
    onChange: (contactId: string | undefined) => void
    placeholder?: string
    filterType?: string
    suggestedType?: string
    className?: string
    name?: string
}

export function ContactPicker({
    value,
    onChange,
    placeholder = 'Select contact...',
    filterType,
    suggestedType,
    className,
    name
}: ContactPickerProps) {
    const [open, setOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)

    // New contact form state
    const [newContact, setNewContact] = useState({
        first_name: '',
        last_name: '',
        company_name: '',
        contact_type: suggestedType || '',
        email: '',
        phone: ''
    })

    useEffect(() => {
        loadContacts()
    }, [])

    async function loadContacts() {
        setLoading(true)
        const data = await getContacts()
        setContacts(data)
        setLoading(false)
    }

    const filteredContacts = filterType
        ? contacts.filter(c => c.contact_type === filterType)
        : contacts

    const selectedContact = contacts.find(c => c.id === value)

    async function handleCreate() {
        if (!newContact.first_name && !newContact.last_name && !newContact.company_name) {
            return
        }

        setCreating(true)
        try {
            const contact = await createContact({
                first_name: newContact.first_name || undefined,
                last_name: newContact.last_name || undefined,
                company_name: newContact.company_name || undefined,
                contact_type: newContact.contact_type || undefined,
                email: newContact.email || undefined,
                phone: newContact.phone || undefined,
            })

            setContacts(prev => [...prev, contact].sort((a, b) =>
                (a.display_name || '').localeCompare(b.display_name || '')
            ))
            onChange(contact.id)
            setDialogOpen(false)
            setOpen(false)
            resetNewContact()
        } catch (err) {
            console.error('Failed to create contact:', err)
        } finally {
            setCreating(false)
        }
    }

    function resetNewContact() {
        setNewContact({
            first_name: '',
            last_name: '',
            company_name: '',
            contact_type: suggestedType || '',
            email: '',
            phone: ''
        })
    }

    function handleQuickCreate() {
        // Pre-fill the search text as either company name or last name
        if (search) {
            setNewContact(prev => ({
                ...prev,
                company_name: search
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
                        {selectedContact?.display_name || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search contacts..."
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
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create new contact{search && ` "${search}"`}
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
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Create new contact...
                                </CommandItem>
                                {/* Existing contacts */}
                                {filteredContacts.map((contact) => (
                                    <CommandItem
                                        key={contact.id}
                                        value={contact.display_name || ''}
                                        onSelect={() => {
                                            onChange(contact.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === contact.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{contact.display_name}</span>
                                            {contact.contact_type && (
                                                <span className="text-xs text-muted-foreground">
                                                    {contact.contact_type}
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

            {/* Create Contact Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Contact</DialogTitle>
                        <DialogDescription>
                            Add a new contact to this workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={newContact.first_name}
                                    onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={newContact.last_name}
                                    onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Company / Organization</Label>
                            <Input
                                id="company_name"
                                value={newContact.company_name}
                                onChange={(e) => setNewContact(prev => ({ ...prev, company_name: e.target.value }))}
                                placeholder="Acme Gallery"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_type">Type</Label>
                            <Select
                                value={newContact.contact_type}
                                onValueChange={(val) => setNewContact(prev => ({ ...prev, contact_type: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTACT_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newContact.email}
                                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+1 555-0123"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating ? 'Creating...' : 'Create Contact'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
