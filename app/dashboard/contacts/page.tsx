import { getContacts } from '@/app/actions/contacts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { Plus } from 'lucide-react'
import { ContactsTable } from '@/components/contacts-table'

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
                <ContactsTable contacts={contacts} />
            )}
        </div>
    )
}
