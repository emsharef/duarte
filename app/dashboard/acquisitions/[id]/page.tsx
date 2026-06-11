import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAcquisition, getAcquisitionObjects, deleteAcquisition } from '@/app/actions/acquisitions'
import { getDocumentsForEntity } from '@/app/actions/documents'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { FileText } from 'lucide-react'

type Props = {
    params: Promise<{ id: string }>
}

export default async function AcquisitionPage({ params }: Props) {
    const { id } = await params
    const acquisition = await getAcquisition(id)

    if (!acquisition) {
        notFound()
    }

    const [objects, documents] = await Promise.all([
        getAcquisitionObjects(id),
        getDocumentsForEntity('acquisition', id),
    ])

    const toNumber = (val: unknown): number | null => {
        if (val === null || val === undefined) return null
        const num = typeof val === 'string' ? parseFloat(val) : (val as number)
        return isNaN(num) ? null : num
    }

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/acquisitions"
                backLabel="Back to Acquisitions"
                editHref={`/dashboard/acquisitions/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteAcquisition.bind(null, id)}
                    redirectTo="/dashboard/acquisitions"
                    confirmMessage="Are you sure you want to delete this acquisition?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">
                    {acquisition.acquisition_subject || 'Untitled Acquisition'}
                </h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Type">{acquisition.acquisition_type}</RecordField>
                    <RecordField label="Date">{formatRecordDate(acquisition.acquisition_date)}</RecordField>
                    <RecordField label="Acquired from">
                        {acquisition.acquired_from_contact_id ? (
                            <Link href={`/dashboard/contacts/${acquisition.acquired_from_contact_id}`} className="hover:underline">
                                {acquisition.acquired_from_contact?.display_name || 'Contact'}
                            </Link>
                        ) : null}
                    </RecordField>
                    <RecordField label="Bought by">
                        {acquisition.bought_by_contact_id ? (
                            <Link href={`/dashboard/contacts/${acquisition.bought_by_contact_id}`} className="hover:underline">
                                {acquisition.bought_by_contact?.display_name || 'Contact'}
                            </Link>
                        ) : null}
                    </RecordField>
                    <RecordField label="Total cost">
                        {formatRecordCurrency(acquisition.total_cost, acquisition.currency || 'USD')}
                    </RecordField>
                    <RecordField label="Currency">{acquisition.currency}</RecordField>
                    <RecordField label="Invoice #">{acquisition.invoice_number}</RecordField>
                    <RecordField label="Invoice date">{formatRecordDate(acquisition.invoice_date)}</RecordField>
                </div>
                {acquisition.notes && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {acquisition.notes}
                    </p>
                )}
            </div>

            <RecordSection title="Objects" count={objects.length}>
                {objects.length === 0 ? (
                    <RecordEmpty text="No objects linked to this acquisition." />
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
                            const price = toNumber(item.object_price)
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
                                        {formatRecordCurrency(price, acquisition.currency || 'USD') || '—'}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Documents" count={documents.length}>
                {documents.length === 0 ? (
                    <RecordEmpty text="No documents linked to this acquisition." />
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
