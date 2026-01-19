import { getContacts } from '@/app/actions/contacts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-muted-foreground">Manage galleries, auction houses, appraisers, and other contacts.</p>
                </div>
                <Link href="/dashboard/contacts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
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
                        {contacts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No contacts found. Add your first contact to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
