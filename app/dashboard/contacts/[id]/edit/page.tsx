import { getContact } from '@/app/actions/contacts'
import { ContactForm } from '../../contact-form'
import { notFound } from 'next/navigation'

export default async function EditContactPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const contact = await getContact(id)

    if (!contact) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Contact</h1>
                <p className="text-muted-foreground">Update contact information.</p>
            </div>
            <ContactForm contact={contact} />
        </div>
    )
}
