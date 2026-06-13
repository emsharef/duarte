import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLoanWithRelations, getLoanObjects, deleteLoan } from '@/app/actions/loans'
import { getDocumentsForEntity } from '@/app/actions/documents'
import {
    getObjectsForSelection, linkObjectToLoan, unlinkObjectFromLoan,
} from '@/app/dashboard/objects/actions'
import { getWorkspaceContext } from '@/lib/workspace'
import {
    RecordToolbar, RecordField,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { LinkedObjectsSection } from '@/components/record-view-linked-objects'
import { LinkedDocumentsSection } from '@/components/record-view-linked-documents'
import { DeleteRecordButton } from '@/components/delete-record-button'

type LinkedObjectRow = {
    loan_value?: number | null
    object: {
        id: string; title: string; inventory_number?: string | null
        artist?: { first_name?: string | null; last_name?: string | null } | null
    } | null
}

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

    const [{ role }, objects, documents] = await Promise.all([
        getWorkspaceContext(),
        getLoanObjects(id) as Promise<LinkedObjectRow[]>,
        getDocumentsForEntity('loan', id),
    ])
    const canEdit = role !== 'viewer'
    const currency = loan.currency || 'USD'

    const linkedObjects = objects
        .filter((item) => item.object)
        .map((item) => {
            const obj = item.object!
            return {
                id: obj.id,
                title: obj.title,
                inventory_number: obj.inventory_number,
                artist_name: obj.artist
                    ? `${obj.artist.first_name || ''} ${obj.artist.last_name || ''}`.trim()
                    : null,
                value: item.loan_value,
            }
        })

    async function linkObject(objectId: string, value: number | null) {
        'use server'
        await linkObjectToLoan(objectId, id, value ?? undefined)
    }

    async function unlinkObject(objectId: string) {
        'use server'
        await unlinkObjectFromLoan(objectId, id)
    }

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

            <LinkedObjectsSection
                title="Objects on loan"
                items={linkedObjects}
                currency={currency}
                valueLabel="Loan value"
                emptyText="No objects linked to this loan."
                canEdit={canEdit}
                loadOptions={getObjectsForSelection}
                onLink={linkObject}
                onUnlink={unlinkObject}
            />

            <LinkedDocumentsSection
                items={documents}
                entityType="loan"
                entityId={id}
                canEdit={canEdit}
            />
        </div>
    )
}
