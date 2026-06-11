import { Suspense } from 'react'
import { getAcquisition, getAcquisitionObjects } from '@/app/actions/acquisitions'
import { AcquisitionForm } from '../../acquisition-form'
import { notFound } from 'next/navigation'

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditAcquisitionPage({ params }: Props) {
    const { id } = await params
    const acquisition = await getAcquisition(id)

    if (!acquisition) {
        notFound()
    }

    // Get linked objects for this acquisition with all financial fields
    const linkedObjects = await getAcquisitionObjects(id)
    const initialObjects = linkedObjects.map(item => {
        // Convert numeric values (may come as strings from DB)
        const toNumber = (val: unknown): number | undefined => {
            if (val === null || val === undefined) return undefined
            const num = typeof val === 'string' ? parseFloat(val) : (val as number)
            return isNaN(num) ? undefined : num
        }

        // Supabase returns single objects for foreign key relations, but TS may infer as array
        const obj = item.object as unknown as { id: string; title: string; inventory_number?: string; artist?: { first_name?: string; last_name?: string } } | null
        const artist = obj?.artist

        return {
            id: obj?.id || '',
            title: obj?.title || '',
            artist_name: artist
                ? `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
                : undefined,
            price: toNumber(item.object_price),
            discount: toNumber(item.discount),
            buyer_premium: toNumber(item.buyer_premium),
            taxes: toNumber(item.taxes),
            lot_number: item.lot_number || undefined
        }
    }).filter(obj => obj.id)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit Acquisition</h1>
                <p className="text-muted-foreground">Update acquisition details.</p>
            </div>
            <Suspense fallback={<div className="text-muted-foreground">Loading form...</div>}>
                <AcquisitionForm acquisition={acquisition} initialObjects={initialObjects} />
            </Suspense>
        </div>
    )
}
