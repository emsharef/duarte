import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLoanWithRelations, getLoanObjects, deleteLoan } from '@/app/actions/loans'
import { getDocumentsForEntity } from '@/app/actions/documents'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { FileText } from 'lucide-react'

export default async function LoanPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const loan = await getLoanWithRelations(id)

    if (!loan) {
        notFound()
    }

    const [objects, documents] = await Promise.all([
        getLoanObjects(id),
        getDocumentsForEntity('loan', id),
    ])

    const counterpartyLabel = loan.direction === 'out' ? 'Borrower' : 'Lender'
    const counterparty = loan.direction === 'out' ? loan.borrower : loan.lender

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/loans"
                backLabel="Back to Loans"
                editHref={`/dashboard/loans/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteLoan.bind(null, id)}
                    redirectTo="/dashboard/loans"
                    confirmMessage="Are you sure you want to delete this loan?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">
                        {loan.loan_subject || 'Untitled Loan'}
                    </h1>
                    {(loan.exhibition_name || loan.venue) && (
                        <p className="mt-1 text-muted-foreground">
                            {[loan.exhibition_name, loan.venue].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Direction">
                        {loan.direction === 'out' ? 'Loan Out' : loan.direction === 'in' ? 'Loan In' : null}
                    </RecordField>
                    <RecordField label="Status">{loan.status}</RecordField>
                    <RecordField label={counterpartyLabel}>
                        {counterparty ? (
                            <Link href={`/dashboard/contacts/${counterparty.id}`} className="hover:underline">
                                {counterparty.display_name || counterparty.company_name || 'Contact'}
                            </Link>
                        ) : null}
                    </RecordField>
                    <RecordField label="Start date">{formatRecordDate(loan.start_date)}</RecordField>
                    <RecordField label="End date">{formatRecordDate(loan.end_date)}</RecordField>
                    <RecordField label="Returned">{formatRecordDate(loan.actual_return_date)}</RecordField>
                    <RecordField label="Insurance value">
                        {formatRecordCurrency(loan.insurance_value, loan.currency || 'USD')}
                    </RecordField>
                    <RecordField label="Insurance policy">
                        {loan.insurance_policy
                            ? loan.insurance_policy.policy_subject || loan.insurance_policy.policy_number || 'Policy'
                            : null}
                    </RecordField>
                </div>
                {loan.notes && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {loan.notes}
                    </p>
                )}
            </div>

            <RecordSection title="Objects on loan" count={objects.length}>
                {objects.length === 0 ? (
                    <RecordEmpty text="No objects linked to this loan." />
                ) : (
                    <ul className="border-y divide-y">
                        {objects.map((item) => {
                            const obj = item.object as unknown as {
                                id: string; title: string; inventory_number?: string | null
                                artist?: { first_name?: string | null; last_name?: string | null } | null
                            } | null
                            if (!obj) return null
                            const artist = obj.artist
                                ? `${obj.artist.first_name || ''} ${obj.artist.last_name || ''}`.trim()
                                : ''
                            return (
                                <li key={obj.id} className="flex items-center justify-between gap-4 py-3">
                                    <div className="min-w-0">
                                        <Link href={`/dashboard/objects/${obj.id}`} className="text-sm font-medium hover:underline">
                                            {obj.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {[artist, obj.inventory_number].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm tabular-nums">
                                        {formatRecordCurrency(item.loan_value, loan.currency || 'USD') || '—'}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Documents" count={documents.length}>
                {documents.length === 0 ? (
                    <RecordEmpty text="No documents linked to this loan." />
                ) : (
                    <ul className="border-y divide-y">
                        {documents.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between gap-4 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <Link href={`/dashboard/documents/${doc.id}`} className="truncate text-sm font-medium hover:underline">
                                        {doc.document_name}
                                    </Link>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {[doc.document_type, formatRecordDate(doc.document_date)].filter(Boolean).join(' · ')}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </RecordSection>
        </div>
    )
}
