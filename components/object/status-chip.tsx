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

const STATUS_COLORS: Record<string, string> = {
    in_collection: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    incoming: 'bg-sky-100 text-sky-800 border-sky-200',
    on_loan: 'bg-amber-100 text-amber-800 border-amber-200',
    on_consignment: 'bg-violet-100 text-violet-800 border-violet-200',
    sold: 'bg-slate-100 text-slate-700 border-slate-200',
    traded: 'bg-slate-100 text-slate-700 border-slate-200',
    gifted: 'bg-slate-100 text-slate-700 border-slate-200',
    donated: 'bg-slate-100 text-slate-700 border-slate-200',
    lost: 'bg-red-100 text-red-800 border-red-200',
    destroyed: 'bg-red-100 text-red-800 border-red-200',
    deaccessioned: 'bg-stone-100 text-stone-700 border-stone-200',
}

function chipClass(status: string) {
    return cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
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
