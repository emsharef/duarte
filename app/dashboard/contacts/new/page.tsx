import { ContactForm } from '../contact-form'

export default function NewContactPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">New Contact</h1>
                <p className="text-muted-foreground">Add a new contact to your collection management system.</p>
            </div>
            <ContactForm />
        </div>
    )
}
