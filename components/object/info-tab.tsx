'use client'

import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ObjectWithRelations, updateObjectFields } from '@/app/dashboard/objects/actions'
import { InlineField, InlineFieldOption } from './inline-field'

type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean'

type FieldDef = {
    key: keyof ObjectWithRelations & string
    label: string
    type?: FieldType
    options?: InlineFieldOption[]
}

type InfoTabProps = {
    object: ObjectWithRelations
    categories: Array<{ id: string; name: string }>
    canEdit: boolean
}

function hasValue(field: FieldDef, value: unknown): boolean {
    if (value == null || value === '') return false
    if (field.type === 'boolean') return value === true
    return true
}

export function InfoTab({ object, categories, canEdit }: InfoTabProps) {
    const [editing, setEditing] = useState(false)
    const categoryOptions: InlineFieldOption[] = categories.map((c) => ({ value: c.id, label: c.name }))

    const groups: Array<{ title: string; fields: FieldDef[] }> = [
        {
            title: 'Identity',
            fields: [
                { key: 'inventory_number', label: 'Inventory #' },
                { key: 'previous_id', label: 'Previous ID' },
                { key: 'credit_line', label: 'Credit line' },
            ],
        },
        {
            title: 'Cataloguing',
            fields: [
                { key: 'title', label: 'Title' },
                { key: 'alternate_title', label: 'Alternate title' },
                { key: 'date_text', label: 'Date (display text)' },
                { key: 'year_created', label: 'Year', type: 'number' },
                { key: 'medium', label: 'Medium' },
                { key: 'object_type', label: 'Object type' },
                { key: 'category_id', label: 'Category', type: 'select', options: categoryOptions },
                { key: 'country_of_origin', label: 'Country of origin' },
                { key: 'edition_number', label: 'Edition number' },
                { key: 'edition_size', label: 'Edition size', type: 'number' },
                { key: 'edition_type', label: 'Edition type' },
                { key: 'suite_portfolio', label: 'Suite / portfolio' },
                { key: 'catalogue_raisonne', label: 'Catalogue raisonné' },
            ],
        },
        {
            title: 'Physical',
            fields: [
                { key: 'is_framed', label: 'Framed', type: 'boolean' },
                { key: 'frame_condition', label: 'Frame condition' },
                { key: 'signature_info', label: 'Signature' },
                { key: 'inscription', label: 'Inscription' },
            ],
        },
        {
            title: 'Texts',
            fields: [
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'provenance', label: 'Provenance', type: 'textarea' },
                { key: 'condition_summary', label: 'Condition summary', type: 'textarea' },
            ],
        },
    ]

    function parseValue(field: FieldDef, value: string | null): unknown {
        if (value == null) return null
        if (field.type === 'number') {
            const n = Number(value)
            return Number.isFinite(n) ? n : null
        }
        if (field.type === 'boolean') return value === 'true'
        return value
    }

    const customFields = Object.entries(object.custom_fields ?? {})

    // View mode shows only populated fields (and drops empty sections);
    // edit mode reveals everything.
    const visibleGroups = groups
        .map((group) => ({
            ...group,
            fields: editing
                ? group.fields
                : group.fields.filter((f) => hasValue(f, object[f.key])),
        }))
        .filter((group) => group.fields.length > 0)

    const nothingPopulated = !editing && visibleGroups.length === 0

    return (
        <div className="space-y-10">
            {canEdit && (
                <div className="-mt-2 flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground/70">
                        {editing ? 'Click any field to edit. Empty fields are shown.' : ' '}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0"
                        onClick={() => setEditing((v) => !v)}
                    >
                        {editing ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Pencil className="mr-1.5 h-3.5 w-3.5" />}
                        {editing ? 'Done' : 'Edit fields'}
                    </Button>
                </div>
            )}

            {nothingPopulated && (
                <p className="border-y border-dashed py-10 text-center text-[13px] text-muted-foreground">
                    No catalogue details yet.{canEdit ? ' Use “Edit fields” to add them.' : ''}
                </p>
            )}

            {visibleGroups.map((group) => (
                <section key={group.title}>
                    <h3 className="mb-4 border-b pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{group.title}</h3>
                    <div className={group.title === 'Texts'
                        ? 'space-y-4'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4'}>
                        {group.fields.map((field) => (
                            <InlineField
                                key={field.key}
                                label={field.label}
                                value={object[field.key] as string | number | boolean | null | undefined}
                                type={field.type}
                                options={field.options}
                                canEdit={canEdit && editing}
                                onSave={(value) =>
                                    updateObjectFields(object.id, { [field.key]: parseValue(field, value) })}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {customFields.length > 0 && (
                <section>
                    <h3 className="mb-4 border-b pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Custom fields</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {customFields.map(([key, value]) => (
                            <div key={key}>
                                <p className="text-xs text-muted-foreground mb-0.5">{key}</p>
                                <p className="text-sm">{value == null || value === '' ? '—' : String(value)}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
