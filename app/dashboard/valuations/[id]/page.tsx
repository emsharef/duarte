import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
    getValuation, getValuationObjects, deleteValuation,
    addObjectToValuation, removeObjectFromValuation,
} from '@/app/actions/valuations'
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
    id: string
    appraised_value?: number | null
    object: {
        id: string; title: string; inventory_number?: string | null
        artist?: { first_name?: string | null; last_name?: string | null } | null
    } | null
}

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

    const [{ role }, objects, documents] = await Promise.all([
        getWorkspaceContext(),
        getValuationObjects(id) as Promise<LinkedObjectRow[]>,
        getDocumentsForEntity('valuation', id),
    ])
    const canEdit = role !== 'viewer'

    const appraiser = valuation.appraiser_contact as { id?: string; display_name?: string } | null
    const currency = valuation.currency || 'USD'

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
                value: item.appraised_value,
            }
        })

    // object_valuations is keyed by its own junction id; map object -> junction
    // so the section's object-id based unlink can resolve the right row.
    const junctionByObject = new Map(
        objects.filter((o) => o.object).map((o) => [o.object!.id, o.id]),
    )

    async function linkObject(objectId: string, value: number | null) {
        'use server'
        await addObjectToValuation(id, objectId, {
            appraised_value: value ?? undefined,
        })
    }

    async function unlinkObject(objectId: string) {
        'use server'
        const junctionId = junctionByObject.get(objectId)
        if (junctionId) await removeObjectFromValuation(junctionId)
    }

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

            <LinkedObjectsSection
                title="Objects appraised"
                items={linkedObjects}
                currency={currency}
                valueLabel="Appraised value"
                emptyText="No objects linked to this valuation."
                canEdit={canEdit}
                loadOptions={getObjectsForSelection}
                onLink={linkObject}
                onUnlink={unlinkObject}
            />

            <LinkedDocumentsSection
                items={documents}
                entityType="valuation"
                entityId={id}
                canEdit={canEdit}
            />
        </div>
    )
}
