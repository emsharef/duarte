import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInsurancePolicy, getPolicyObjects, deleteInsurancePolicy } from '@/app/actions/insurance'
import { getDocumentsForEntity } from '@/app/actions/documents'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { FileText } from 'lucide-react'

export default async function InsurancePolicyPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const policy = await getInsurancePolicy(id)

    if (!policy) {
        notFound()
    }

    const [objects, documents] = await Promise.all([
        getPolicyObjects(id),
        getDocumentsForEntity('insurance', id),
    ])

    const insurer = policy.insurer_contact as { id?: string; display_name?: string } | null
    const currency = policy.currency || 'USD'

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/insurance"
                backLabel="Back to Insurance"
                editHref={`/dashboard/insurance/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteInsurancePolicy.bind(null, id)}
                    redirectTo="/dashboard/insurance"
                    confirmMessage="Are you sure you want to delete this policy?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">
                        {policy.policy_subject || 'Untitled Policy'}
                    </h1>
                    {policy.policy_number && (
                        <p className="mt-1 text-muted-foreground">{policy.policy_number}</p>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Policy number">{policy.policy_number}</RecordField>
                    <RecordField label="Insurer">
                        {insurer ? (
                            insurer.id ? (
                                <Link href={`/dashboard/contacts/${insurer.id}`} className="hover:underline">
                                    {insurer.display_name || 'Contact'}
                                </Link>
                            ) : (
                                insurer.display_name
                            )
                        ) : null}
                    </RecordField>
                    <RecordField label="Coverage type">{policy.coverage_type}</RecordField>
                    <RecordField label="Start date">{formatRecordDate(policy.start_date)}</RecordField>
                    <RecordField label="End date">{formatRecordDate(policy.end_date)}</RecordField>
                    <RecordField label="Total coverage">
                        {formatRecordCurrency(policy.total_coverage, currency)}
                    </RecordField>
                    <RecordField label="Premium">
                        {formatRecordCurrency(policy.premium, currency)}
                    </RecordField>
                    <RecordField label="Deductible">
                        {formatRecordCurrency(policy.deductible, currency)}
                    </RecordField>
                    <RecordField label="Currency">{currency}</RecordField>
                    <RecordField label="Active">{policy.is_active ? 'Yes' : 'No'}</RecordField>
                </div>
                {policy.notes && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {policy.notes}
                    </p>
                )}
            </div>

            <RecordSection title="Objects covered" count={objects.length}>
                {objects.length === 0 ? (
                    <RecordEmpty text="No objects linked to this policy." />
                ) : (
                    <ul className="border-y divide-y">
                        {objects.map((item, idx) => {
                            const obj = item.object as unknown as {
                                id: string; title: string; inventory_number?: string | null
                                artist?: { first_name?: string | null; last_name?: string | null } | null
                            } | null
                            if (!obj) return null
                            const artist = obj.artist
                                ? `${obj.artist.first_name || ''} ${obj.artist.last_name || ''}`.trim()
                                : ''
                            return (
                                <li key={obj.id || idx} className="flex items-center justify-between gap-4 py-3">
                                    <div className="min-w-0">
                                        <Link href={`/dashboard/objects/${obj.id}`} className="text-sm font-medium hover:underline">
                                            {obj.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {[artist, obj.inventory_number].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm tabular-nums">
                                        {formatRecordCurrency(item.insured_value, currency) || '—'}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Documents" count={documents.length}>
                {documents.length === 0 ? (
                    <RecordEmpty text="No documents linked to this policy." />
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
