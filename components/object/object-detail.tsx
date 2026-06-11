'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ObjectWithRelations, ActivityEntry, deleteObject } from '@/app/dashboard/objects/actions'
import { ObjectHeader } from './object-header'
import { InfoTab } from './info-tab'
import { ImagesTab } from './images-tab'
import { DimensionsTab } from './dimensions-tab'
import { AcquisitionTab } from './acquisition-tab'
import { ValuationsTab } from './valuations-tab'
import { InsuranceTab } from './insurance-tab'
import { LoansTab } from './loans-tab'
import { ExpensesTab } from './expenses-tab'
import { DocumentsTab } from './documents-tab'
import { ListsTab } from './lists-tab'
import { ActivityTab } from './activity-tab'
import { Toasts, toastError } from './shared'

type ObjectDetailProps = {
    object: ObjectWithRelations
    activity: ActivityEntry[]
    categories: Array<{ id: string; name: string }>
    navIds: string[]
    ctxParam?: string
    canEdit: boolean
}

type TabConfig = {
    key: string
    label: string
    count?: number
    content: React.ReactNode
}

export function ObjectDetail({ object, activity, categories, navIds, ctxParam, canEdit }: ObjectDetailProps) {
    const [deleting, setDeleting] = useState(false)

    // Prev/next paging through the object set the user came from (?ctx=),
    // falling back to workspace-wide created_at order.
    const navIndex = navIds.indexOf(object.id)
    const prevId = navIndex > 0 ? navIds[navIndex - 1] : null
    const nextId = navIndex >= 0 && navIndex < navIds.length - 1 ? navIds[navIndex + 1] : null
    const navHref = (id: string) => `/dashboard/objects/${id}${ctxParam ? `?ctx=${encodeURIComponent(ctxParam)}` : ''}`

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this object? This action cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteObject(object.id)
        } catch (err) {
            // deleteObject redirects on success; only failures land here
            if (!(err instanceof Error && err.message.includes('NEXT_REDIRECT'))) {
                toastError(err instanceof Error ? err.message : 'Failed to delete object')
                setDeleting(false)
            }
        }
    }

    // Data-driven tab strip: Phase 3 modules register here as new entries.
    const tabs: TabConfig[] = [
        { key: 'info', label: 'Info', content: <InfoTab object={object} categories={categories} canEdit={canEdit} /> },
        { key: 'images', label: 'Images', count: object.object_media?.length ?? 0, content: <ImagesTab object={object} canEdit={canEdit} /> },
        { key: 'dimensions', label: 'Dimensions', count: object.object_dimensions?.length ?? 0, content: <DimensionsTab object={object} canEdit={canEdit} /> },
        { key: 'acquisition', label: 'Acquisition', count: object.acquisitions?.length ?? 0, content: <AcquisitionTab object={object} canEdit={canEdit} /> },
        { key: 'valuations', label: 'Valuations', count: object.valuations?.length ?? 0, content: <ValuationsTab object={object} canEdit={canEdit} /> },
        { key: 'insurance', label: 'Insurance', count: object.insurance?.length ?? 0, content: <InsuranceTab object={object} canEdit={canEdit} /> },
        { key: 'loans', label: 'Loans', count: object.loans?.length ?? 0, content: <LoansTab object={object} canEdit={canEdit} /> },
        { key: 'expenses', label: 'Expenses', count: object.expenses?.length ?? 0, content: <ExpensesTab object={object} canEdit={canEdit} /> },
        { key: 'documents', label: 'Documents', count: object.documents?.length ?? 0, content: <DocumentsTab object={object} canEdit={canEdit} /> },
        { key: 'lists', label: 'Lists', count: object.lists?.length ?? 0, content: <ListsTab object={object} canEdit={canEdit} /> },
        { key: 'activity', label: 'Activity', content: <ActivityTab activity={activity} /> },
    ]

    return (
        <div className="max-w-6xl mx-auto pb-10 space-y-6">
            <Toasts />

            {/* Top bar: back, prev/next paging, delete */}
            <div className="flex items-center justify-between gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Inventory
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    {navIndex >= 0 && navIds.length > 1 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {prevId ? (
                                <Link href={navHref(prevId)}>
                                    <Button variant="outline" size="icon" className="h-8 w-8" title="Previous object">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <span className="px-1 tabular-nums">{navIndex + 1} of {navIds.length}</span>
                            {nextId ? (
                                <Link href={navHref(nextId)}>
                                    <Button variant="outline" size="icon" className="h-8 w-8" title="Next object">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                    {canEdit && (
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    )}
                </div>
            </div>

            <ObjectHeader object={object} activity={activity} canEdit={canEdit} />

            <Tabs defaultValue="info">
                <TabsList className="h-auto flex-wrap justify-start">
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                            {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key} className="mt-6">
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
