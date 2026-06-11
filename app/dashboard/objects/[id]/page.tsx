import Link from 'next/link'
import { getWorkspaceContext } from '@/lib/workspace'
import {
    getCategories, getObjectActivity, getObjectNavIds, getObjectWithRelations,
} from '../actions'
import { ObjectDetail } from '@/components/object/object-detail'
import { Button } from '@/components/ui/button'

type PageProps = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ ctx?: string }>
}

// Thin server component: auth + data, delegating to client components.
export default async function ObjectDetailPage({ params, searchParams }: PageProps) {
    const [{ id }, { ctx }] = await Promise.all([params, searchParams])
    const { role } = await getWorkspaceContext()

    const [object, activity, categories] = await Promise.all([
        getObjectWithRelations(id),
        getObjectActivity(id),
        getCategories(),
    ])

    if (!object) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Object not found</h2>
                <Link href="/dashboard">
                    <Button variant="link">Return to Inventory</Button>
                </Link>
            </div>
        )
    }

    // Paging context: ordered ids from the list the user came from (?ctx=),
    // falling back to workspace objects by created_at desc.
    const ctxParam = typeof ctx === 'string' && ctx.length > 0 ? ctx : undefined
    const navIds = ctxParam
        ? ctxParam.split(',').filter(Boolean)
        : await getObjectNavIds()

    return (
        <ObjectDetail
            object={object}
            activity={activity}
            categories={categories}
            navIds={navIds}
            ctxParam={ctxParam}
            canEdit={role !== 'viewer'}
        />
    )
}
