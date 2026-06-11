import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContact, getContactAcquisitions, getContactLoans, deleteContact } from '@/app/actions/contacts'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'

export default async function ContactPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const contact = await getContact(id)

    if (!contact) {
        notFound()
    }

    const [acquisitions, loans] = await Promise.all([
        getContactAcquisitions(id),
        getContactLoans(id),
    ])

    const name = contact.display_name
        || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        || contact.company_name
        || 'Unnamed Contact'

    const address = [
        contact.address_line1,
        contact.address_line2,
        [contact.city, contact.state, contact.postal_code].filter(Boolean).join(', '),
        contact.country,
    ].filter(Boolean)

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/contacts"
                backLabel="Back to Contacts"
                editHref={`/dashboard/contacts/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteContact.bind(null, id)}
                    redirectTo="/dashboard/contacts"
                    confirmMessage="Are you sure you want to delete this contact?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">{name}</h1>
                    {(contact.contact_type || contact.company_name) && (
                        <p className="mt-1 text-muted-foreground">
                            {[contact.contact_type, contact.company_name !== name ? contact.company_name : null]
                                .filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Email">
                        {contact.email ? (
                            <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                        ) : null}
                    </RecordField>
                    <RecordField label="Phone">{contact.phone}</RecordField>
                    <RecordField label="Mobile">{contact.mobile}</RecordField>
                    <RecordField label="Website">
                        {contact.website ? (
                            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {contact.website}
                            </a>
                        ) : null}
                    </RecordField>
                    <RecordField label="Address">
                        {address.length > 0 ? address.join(', ') : null}
                    </RecordField>
                </div>
                {contact.notes && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {contact.notes}
                    </p>
                )}
            </div>

            <RecordSection title="Acquisitions" count={acquisitions.length}>
                {acquisitions.length === 0 ? (
                    <RecordEmpty text="No acquisitions involving this contact." />
                ) : (
                    <ul className="border-y divide-y">
                        {acquisitions.map((acq) => (
                            <li key={acq.id} className="flex items-center justify-between gap-4 py-3">
                                <div className="min-w-0">
                                    <Link href={`/dashboard/acquisitions/${acq.id}`} className="text-sm font-medium hover:underline">
                                        {acq.acquisition_subject || 'Untitled Acquisition'}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        {[
                                            acq.acquired_from_contact_id === id ? 'Seller' : 'Buyer',
                                            acq.acquisition_type,
                                            formatRecordDate(acq.acquisition_date),
                                        ].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm tabular-nums">
                                    {formatRecordCurrency(acq.total_cost, acq.currency || 'USD') || '—'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Loans" count={loans.length}>
                {loans.length === 0 ? (
                    <RecordEmpty text="No loans involving this contact." />
                ) : (
                    <ul className="border-y divide-y">
                        {loans.map((loan) => (
                            <li key={loan.id} className="flex items-center justify-between gap-4 py-3">
                                <div className="min-w-0">
                                    <Link href={`/dashboard/loans/${loan.id}`} className="text-sm font-medium hover:underline">
                                        {loan.loan_subject || 'Untitled Loan'}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        {[
                                            loan.borrower_contact_id === id ? 'Borrower' : 'Lender',
                                            formatRecordDate(loan.start_date),
                                            formatRecordDate(loan.end_date),
                                        ].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">{loan.status}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </RecordSection>
        </div>
    )
}
