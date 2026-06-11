'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OBJECT_STATUSES, OBJECT_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toastError } from './shared'

// Muted tonal chip colors (exhibition-catalogue palette — no candy colors)
const STATUS_COLORS: Record<string, string> = {
    in_collection: 'bg-emerald-700/10 text-emerald-900',
    incoming: 'bg-amber-600/10 text-amber-900',
    on_loan: 'bg-sky-700/10 text-sky-900',
    on_consignment: 'bg-sky-700/10 text-sky-900',
    sold: 'bg-stone-500/10 text-stone-600',
    traded: 'bg-stone-500/10 text-stone-600',
    gifted: 'bg-stone-500/10 text-stone-600',
    donated: 'bg-stone-500/10 text-stone-600',
    lost: 'bg-red-700/10 text-red-900',
    destroyed: 'bg-red-700/10 text-red-900',
    deaccessioned: 'bg-stone-500/10 text-stone-600',
}

function chipClass(status: string) {
    return cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        STATUS_COLORS[status] ?? 'bg-stone-500/10 text-stone-600'
    )
}

type StatusChipProps = {
    status: string
    canEdit?: boolean
    onChange?: (status: string) => Promise<void>
}

// Colored lifecycle-status chip; when editable it opens a dropdown and saves
// optimistically (rollback + toast on failure). Shared with list rows later.
export function StatusChip({ status, canEdit = false, onChange }: StatusChipProps) {
    const [current, setCurrent] = useState(status)

    useEffect(() => { setCurrent(status) }, [status])

    async function handleSelect(next: string) {
        if (next === current || !onChange) return
        const prev = current
        setCurrent(next)
        try {
            await onChange(next)
        } catch (err) {
            setCurrent(prev)
            toastError(err instanceof Error ? err.message : 'Failed to update status')
        }
    }

    const label = OBJECT_STATUS_LABELS[current] ?? current

    if (!canEdit || !onChange) {
        return <span className={chipClass(current)}>{label}</span>
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" className={cn(chipClass(current), 'cursor-pointer hover:opacity-80')}>
                    {label}
                    <ChevronDown className="h-3 w-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {OBJECT_STATUSES.map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => handleSelect(s)}>
                        <span className={chipClass(s)}>{OBJECT_STATUS_LABELS[s]}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
