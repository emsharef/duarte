import { getAcquisition, getAcquisitionObjects } from '@/app/actions/acquisitions'
import { AcquisitionForm } from '../acquisition-form'
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
        const toNumber = (val: any): number | undefined => {
            if (val === null || val === undefined) return undefined
            const num = typeof val === 'string' ? parseFloat(val) : val
            return isNaN(num) ? undefined : num
        }

        return {
            id: item.object?.id || '',
            title: item.object?.title || '',
            artist_name: item.object?.artist
                ? `${item.object.artist.first_name || ''} ${item.object.artist.last_name || ''}`.trim()
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
                <h1 className="text-2xl font-bold tracking-tight">Edit Acquisition</h1>
                <p className="text-muted-foreground">Update acquisition details.</p>
            </div>
            <AcquisitionForm acquisition={acquisition} initialObjects={initialObjects} />
        </div>
    )
}
