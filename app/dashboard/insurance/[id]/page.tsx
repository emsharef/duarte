import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
    getInsurancePolicy, getPolicyObjects, deleteInsurancePolicy,
    linkObjectToPolicy, unlinkObjectFromPolicy,
} from '@/app/actions/insurance'
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
    insured_value?: number | null
    object: {
        id: string; title: string; inventory_number?: string | null
        artist?: { first_name?: string | null; last_name?: string | null } | null
    } | null
}

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

    const [{ role }, objects, documents] = await Promise.all([
        getWorkspaceContext(),
        getPolicyObjects(id) as Promise<LinkedObjectRow[]>,
        getDocumentsForEntity('insurance', id),
    ])
    const canEdit = role !== 'viewer'

    const insurer = policy.insurer_contact as { id?: string; display_name?: string } | null
    const currency = policy.currency || 'USD'

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
                value: item.insured_value,
            }
        })

    async function linkObject(objectId: string, value: number | null) {
        'use server'
        await linkObjectToPolicy(objectId, id, value ?? undefined)
    }

    async function unlinkObject(objectId: string) {
        'use server'
        await unlinkObjectFromPolicy(objectId, id)
    }

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

            <LinkedObjectsSection
                title="Objects covered"
                items={linkedObjects}
                currency={currency}
                valueLabel="Insured value"
                emptyText="No objects linked to this policy."
                canEdit={canEdit}
                loadOptions={getObjectsForSelection}
                onLink={linkObject}
                onUnlink={unlinkObject}
            />

            <LinkedDocumentsSection
                items={documents}
                entityType="insurance"
                entityId={id}
                canEdit={canEdit}
            />
        </div>
    )
}
