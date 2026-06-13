'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import type { Contact } from '@/app/actions/contacts'
import { CONTACT_TYPES } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const ALL_TYPES = '__all__'

type SortKey = 'name' | 'type' | 'company' | 'email' | 'phone' | 'city'
type SortDir = 'asc' | 'desc'

function contactName(c: Contact): string {
    return (
        c.display_name ||
        `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
        '-'
    )
}

function sortValue(c: Contact, key: SortKey): string {
    switch (key) {
        case 'name':
            return contactName(c)
        case 'type':
            return c.contact_type || ''
        case 'company':
            return c.company_name || ''
        case 'email':
            return c.email || ''
        case 'phone':
            return c.phone || ''
        case 'city':
            return c.city || ''
    }
}

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES)
    const [sortKey, setSortKey] = useState<SortKey>('name')
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase()
        const filtered = contacts.filter((c) => {
            if (typeFilter !== ALL_TYPES && c.contact_type !== typeFilter) {
                return false
            }
            if (!q) return true
            const haystack = [
                contactName(c),
                c.company_name,
                c.email,
                c.city,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
            return haystack.includes(q)
        })

        const sorted = [...filtered].sort((a, b) => {
            const av = sortValue(a, sortKey).toLowerCase()
            const bv = sortValue(b, sortKey).toLowerCase()
            const cmp = av.localeCompare(bv)
            return sortDir === 'asc' ? cmp : -cmp
        })

        return sorted
    }, [contacts, query, typeFilter, sortKey, sortDir])

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    const columns: { key: SortKey; label: string }[] = [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'company', label: 'Company' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'city', label: 'City' },
    ]

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search contacts..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_TYPES}>All types</SelectItem>
                        {CONTACT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <p className="text-xs text-muted-foreground">
                {rows.length} {rows.length === 1 ? 'contact' : 'contacts'}
            </p>

            <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => {
                                const active = sortKey === col.key
                                const Icon = !active
                                    ? ArrowUpDown
                                    : sortDir === 'asc'
                                      ? ArrowUp
                                      : ArrowDown
                                return (
                                    <TableHead key={col.key}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSort(col.key)}
                                            className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase tracking-wider transition-colors hover:text-foreground"
                                        >
                                            {col.label}
                                            <Icon
                                                className={
                                                    active
                                                        ? 'h-3 w-3 text-primary'
                                                        : 'h-3 w-3 opacity-40'
                                                }
                                            />
                                        </button>
                                    </TableHead>
                                )
                            })}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    No contacts match your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell>
                                        <Link
                                            href={`/dashboard/contacts/${contact.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {contactName(contact)}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {contact.contact_type && (
                                            <Badge variant="outline">
                                                {contact.contact_type}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{contact.company_name || '-'}</TableCell>
                                    <TableCell>{contact.email || '-'}</TableCell>
                                    <TableCell>{contact.phone || '-'}</TableCell>
                                    <TableCell>{contact.city || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/contacts/${contact.id}/edit`}>
                                            <Button variant="ghost" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
