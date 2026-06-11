'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { batchSetStatus } from '@/app/actions/views'
import { LIST_STATUSES, LIST_STATUS_LABELS, statusChipClass } from '@/lib/list-columns'
import { cn } from '@/lib/utils'

type StatusChipProps = {
    objectId: string
    status: string
    canEdit: boolean
}

export function StatusChip({ objectId, status, canEdit }: StatusChipProps) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    const label = LIST_STATUS_LABELS[status] ?? status
    const chipClass = cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        statusChipClass(status)
    )

    if (!canEdit) {
        return <span className={chipClass}>{label}</span>
    }

    function setStatus(next: string) {
        if (next === status) return
        startTransition(async () => {
            try {
                await batchSetStatus([objectId], next)
                router.refresh()
            } catch (err) {
                console.error('Failed to update status:', err)
                window.alert(err instanceof Error ? err.message : 'Failed to update status')
            }
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(chipClass, 'gap-1 hover:opacity-80', pending && 'opacity-50')}
                    disabled={pending}
                    onClick={(e) => e.stopPropagation()}
                >
                    {label}
                    <ChevronDown className="h-3 w-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                {LIST_STATUSES.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                        <span
                            className={cn(
                                'mr-2 inline-block h-2 w-2 rounded-full',
                                statusChipClass(s).split(' ')[0]
                            )}
                        />
                        {LIST_STATUS_LABELS[s] ?? s}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
