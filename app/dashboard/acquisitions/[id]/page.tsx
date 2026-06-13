import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
    getAcquisition, getAcquisitionObjects, deleteAcquisition,
    linkObjectToAcquisition, unlinkObjectFromAcquisition,
} from '@/app/actions/acquisitions'
import { getDocumentsForEntity } from '@/app/actions/documents'
import { getObjectsForSelection } from '@/app/dashboard/objects/actions'
import { getWorkspaceContext } from '@/lib/workspace'
import {
    RecordToolbar, RecordField,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { LinkedObjectsSection } from '@/components/record-view-linked-objects'
import { LinkedDocumentsSection } from '@/components/record-view-linked-documents'
import { DeleteRecordButton } from '@/components/delete-record-button'

type LinkedObjectRow = {
    object_price?: number | string | null
    object: {
        id: string; title: string; inventory_number?: string | null
        artist?: { first_name?: string | null; last_name?: string | null } | null
    } | null
}

type Props = {
    params: Promise<{ id: string }>
}

const toNumber = (val: unknown): number | null => {
    if (val === null || val === undefined) return null
    const num = typeof val === 'string' ? parseFloat(val) : (val as number)
    return isNaN(num) ? null : num
}

export default async function AcquisitionPage({ params }: Props) {
    const { id } = await params
    const acquisition = await getAcquisition(id)

    if (!acquisition) {
        notFound()
    }

    const [{ role }, objects, documents] = await Promise.all([
        getWorkspaceContext(),
        getAcquisitionObjects(id) as Promise<LinkedObjectRow[]>,
        getDocumentsForEntity('acquisition', id),
    ])
    const canEdit = role !== 'viewer'
    const currency = acquisition.currency || 'USD'

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
                value: toNumber(item.object_price),
            }
        })

    async function linkObject(objectId: string, value: number | null) {
        'use server'
        await linkObjectToAcquisition(objectId, id, value ?? undefined)
    }

    async function unlinkObject(objectId: string) {
        'use server'
        await unlinkObjectFromAcquisition(objectId, id)
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
                    <RecordField label="Paid date">{formatRecordDate(acquisition.paid_date)}</RecordField>
                </div>
                {acquisition.notes && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {acquisition.notes}
                    </p>
                )}
            </div>

            <LinkedObjectsSection
                title="Objects"
                items={linkedObjects}
                currency={currency}
                valueLabel="Price"
                emptyText="No objects linked to this acquisition."
                canEdit={canEdit}
                loadOptions={getObjectsForSelection}
                onLink={linkObject}
                onUnlink={unlinkObject}
            />

            <LinkedDocumentsSection
                items={documents}
                entityType="acquisition"
                entityId={id}
                canEdit={canEdit}
            />
        </div>
    )
}
