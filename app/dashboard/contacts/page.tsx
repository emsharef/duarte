import { getContacts } from '@/app/actions/contacts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { Plus } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function ContactsPage() {
    const contacts = await getContacts()

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">Contacts</h1>
                    <p className="text-muted-foreground">Manage galleries, auction houses, appraisers, and other contacts.</p>
                </div>
                <Link href="/dashboard/contacts/new">
                    <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
                    </Button>
                </Link>
            </div>

            {contacts.length === 0 ? (
                <EmptyState
                    text="No contacts yet."
                    action={
                        <Link href="/dashboard/contacts/new" className="text-[13px] font-medium text-primary underline-offset-4 hover:underline">
                            Add your first contact
                        </Link>
                    }
                />
            ) : (
            <div className="border rounded-md">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell className="font-medium">
                                    {contact.display_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '-'}
                                </TableCell>
                                <TableCell>
                                    {contact.contact_type && (
                                        <Badge variant="outline">{contact.contact_type}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{contact.company_name || '-'}</TableCell>
                                <TableCell>{contact.email || '-'}</TableCell>
                                <TableCell>{contact.phone || '-'}</TableCell>
                                <TableCell>{contact.city || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/contacts/${contact.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}
        </div>
    )
}
