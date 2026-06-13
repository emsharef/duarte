import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getValuation, getValuationObjects, deleteValuation } from '@/app/actions/valuations'
import { getDocumentsForEntity } from '@/app/actions/documents'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { FileText } from 'lucide-react'

export default async function ValuationPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const valuation = await getValuation(id)

    if (!valuation) {
        notFound()
    }

    const [objects, documents] = await Promise.all([
        getValuationObjects(id),
        getDocumentsForEntity('valuation', id),
    ])

    const appraiser = valuation.appraiser_contact as { id?: string; display_name?: string } | null
    const currency = valuation.currency || 'USD'

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/valuations"
                backLabel="Back to Valuations"
                editHref={`/dashboard/valuations/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteValuation.bind(null, id)}
                    redirectTo="/dashboard/valuations"
                    confirmMessage="Are you sure you want to delete this valuation?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">
                        {valuation.valuation_subject || 'Untitled Valuation'}
                    </h1>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Value type">{valuation.value_type}</RecordField>
                    <RecordField label="Status">{valuation.valuation_status}</RecordField>
                    <RecordField label="Appraiser">
                        {appraiser ? (
                            appraiser.id ? (
                                <Link href={`/dashboard/contacts/${appraiser.id}`} className="hover:underline">
                                    {appraiser.display_name || 'Contact'}
                                </Link>
                            ) : (
                                appraiser.display_name
                            )
                        ) : null}
                    </RecordField>
                    <RecordField label="Date">{formatRecordDate(valuation.valuation_date)}</RecordField>
                    <RecordField label="Total value">
                        {formatRecordCurrency(valuation.total_value, currency)}
                    </RecordField>
                    <RecordField label="Currency">{currency}</RecordField>
                </div>
                {valuation.notes && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {valuation.notes}
                    </p>
                )}
            </div>

            <RecordSection title="Objects appraised" count={objects.length}>
                {objects.length === 0 ? (
                    <RecordEmpty text="No objects linked to this valuation." />
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
                            const range = [item.low_estimate, item.high_estimate].some((v) => v != null)
                                ? `${formatRecordCurrency(item.low_estimate, currency) || '—'} – ${formatRecordCurrency(item.high_estimate, currency) || '—'}`
                                : null
                            return (
                                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                                    <div className="min-w-0">
                                        <Link href={`/dashboard/objects/${obj.id}`} className="text-sm font-medium hover:underline">
                                            {obj.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {[artist, obj.inventory_number, range].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm tabular-nums">
                                        {formatRecordCurrency(item.appraised_value, currency) || '—'}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Documents" count={documents.length}>
                {documents.length === 0 ? (
                    <RecordEmpty text="No documents linked to this valuation." />
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
