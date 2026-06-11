'use client'

import { useState } from 'react'
import { CirclePlus, Pencil, Trash2 } from 'lucide-react'
import { ActivityEntry } from '@/app/dashboard/objects/actions'
import { cn } from '@/lib/utils'
import { EmptyState, formatDateTime } from './shared'

const ACTION_LABELS: Record<string, string> = {
    insert: 'Created',
    update: 'Edits',
    delete: 'Deleted',
}

const SKIPPED_KEYS = new Set(['updated_at', 'created_at', 'id', 'workspace_id'])

type Diff = { key: string; from: string; to: string }

function formatValue(value: unknown): string {
    if (value == null || value === '') return '—'
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
    return text.length > 60 ? `${text.slice(0, 57)}...` : text
}

// Compute a compact field-level diff from the stored changes jsonb
// ({ old, new } for updates).
function computeDiff(entry: ActivityEntry): Diff[] {
    if (entry.action !== 'update' || !entry.changes) return []
    const oldRow = (entry.changes.old ?? {}) as Record<string, unknown>
    const newRow = (entry.changes.new ?? {}) as Record<string, unknown>
    const keys = new Set([...Object.keys(oldRow), ...Object.keys(newRow)])
    const diffs: Diff[] = []
    for (const key of keys) {
        if (SKIPPED_KEYS.has(key)) continue
        if (JSON.stringify(oldRow[key] ?? null) === JSON.stringify(newRow[key] ?? null)) continue
        diffs.push({ key, from: formatValue(oldRow[key]), to: formatValue(newRow[key]) })
    }
    return diffs
}

function ActionIcon({ action }: { action: string }) {
    const cls = 'h-4 w-4'
    if (action === 'insert') return <CirclePlus className={cn(cls, 'text-emerald-600')} />
    if (action === 'delete') return <Trash2 className={cn(cls, 'text-red-600')} />
    return <Pencil className={cn(cls, 'text-blue-600')} />
}

export function ActivityTab({ activity }: { activity: ActivityEntry[] }) {
    const [filter, setFilter] = useState<string>('all')

    const presentActions = Array.from(new Set(activity.map((e) => e.action)))
    const chips = [
        { key: 'all', label: 'All' },
        ...presentActions.map((a) => ({ key: a, label: ACTION_LABELS[a] ?? a })),
    ]

    const filtered = filter === 'all' ? activity : activity.filter((e) => e.action === filter)

    if (activity.length === 0) {
        return <EmptyState text="No activity recorded for this object yet." />
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                    <button
                        key={chip.key}
                        type="button"
                        onClick={() => setFilter(chip.key)}
                        className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            filter === chip.key
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'text-muted-foreground hover:bg-muted'
                        )}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            <div className="space-y-0">
                {filtered.map((entry, i) => {
                    const diffs = computeDiff(entry)
                    return (
                        <div key={entry.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="mt-1 rounded-full border bg-card p-1.5">
                                    <ActionIcon action={entry.action} />
                                </div>
                                {i < filtered.length - 1 && <div className="w-px flex-1 bg-border" />}
                            </div>
                            <div className="pb-6 min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                    {entry.action === 'insert' && 'Object created'}
                                    {entry.action === 'update' && 'Object updated'}
                                    {entry.action === 'delete' && 'Object deleted'}
                                    {!['insert', 'update', 'delete'].includes(entry.action) && entry.action}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTime(entry.created_at)}
                                    {entry.user_email && ` · ${entry.user_email}`}
                                </p>
                                {diffs.length > 0 && (
                                    <ul className="mt-1.5 space-y-0.5">
                                        {diffs.map((d) => (
                                            <li key={d.key} className="text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">{d.key}</span>
                                                {': '}
                                                <span className="line-through">{d.from}</span>
                                                {' → '}
                                                <span className="text-foreground">{d.to}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
