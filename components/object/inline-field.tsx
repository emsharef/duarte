'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toastError } from './shared'

export type InlineFieldOption = { value: string; label: string }

const CLEAR_VALUE = '__clear__'

type InlineFieldProps = {
    label: string
    value: string | number | boolean | null | undefined
    type?: 'text' | 'number' | 'textarea' | 'select' | 'boolean'
    options?: InlineFieldOption[]
    canEdit: boolean
    onSave: (value: string | null) => Promise<void>
    placeholder?: string
    clearable?: boolean
}

// Renders a label + value pair. Click the value (when editable) to swap to an
// input; Enter/blur saves optimistically (rollback + toast on failure),
// Escape cancels.
export function InlineField({
    label,
    value,
    type = 'text',
    options,
    canEdit,
    onSave,
    placeholder = '—',
    clearable = true,
}: InlineFieldProps) {
    const initial = value == null ? null : String(value)
    const [current, setCurrent] = useState<string | null>(initial)
    const [prevInitial, setPrevInitial] = useState<string | null>(initial)
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState('')
    const escaped = useRef(false)

    // Sync from server data when it changes (e.g. after router.refresh()).
    if (initial !== prevInitial) {
        setPrevInitial(initial)
        setCurrent(initial)
    }

    async function commit(next: string | null) {
        setEditing(false)
        const normalized = next === '' ? null : next
        if (normalized === current) return
        const prev = current
        setCurrent(normalized)
        try {
            await onSave(normalized)
        } catch (err) {
            setCurrent(prev)
            toastError(err instanceof Error ? err.message : `Failed to save ${label}`)
        }
    }

    function startEdit() {
        if (!canEdit) return
        escaped.current = false
        setDraft(current ?? '')
        setEditing(true)
    }

    const isSelect = type === 'select' || type === 'boolean'
    const selectOptions: InlineFieldOption[] = type === 'boolean'
        ? [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
        : options ?? []

    function displayText(): string {
        if (current == null || current === '') return placeholder
        if (isSelect) {
            return selectOptions.find((o) => o.value === current)?.label ?? current
        }
        return current
    }

    let editor: React.ReactNode = null
    if (editing) {
        if (isSelect) {
            editor = (
                <Select
                    defaultOpen
                    value={current ?? undefined}
                    onValueChange={(v) => commit(v === CLEAR_VALUE ? null : v)}
                    onOpenChange={(open) => { if (!open) setEditing(false) }}
                >
                    <SelectTrigger className="h-8 w-full" autoFocus>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {clearable && type !== 'boolean' && (
                            <SelectItem value={CLEAR_VALUE}>—</SelectItem>
                        )}
                        {selectOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        } else {
            const sharedProps = {
                autoFocus: true,
                value: draft,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
                onBlur: () => {
                    if (escaped.current) return
                    commit(draft)
                },
                onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && !(type === 'textarea' && !e.metaKey && !e.ctrlKey)) {
                        e.preventDefault()
                        commit(draft)
                    }
                    if (e.key === 'Escape') {
                        escaped.current = true
                        setEditing(false)
                    }
                },
            }
            editor = type === 'textarea'
                ? <Textarea {...sharedProps} rows={3} className="text-sm" />
                : <Input {...sharedProps} type={type === 'number' ? 'number' : 'text'} className="h-8" />
        }
    }

    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            {editing ? editor : (
                <p
                    onClick={startEdit}
                    className={cn(
                        'text-sm min-h-6 whitespace-pre-wrap break-words rounded px-1 -mx-1 py-0.5',
                        canEdit && 'cursor-pointer hover:bg-muted/70',
                        (current == null || current === '') && 'text-muted-foreground'
                    )}
                    title={canEdit ? 'Click to edit' : undefined}
                >
                    {displayText()}
                </p>
            )}
        </div>
    )
}
