'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCategory, deleteCategory, updateCategory } from '@/app/actions/categories'

type CategoryRow = { id: string; name: string; objectCount: number }

export function CategoriesPanel({
    categories,
    canEdit,
}: {
    categories: CategoryRow[]
    canEdit: boolean
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<string | null>(null)

    function run(fn: () => Promise<unknown>) {
        setError(null)
        startTransition(async () => {
            try {
                await fn()
                router.refresh()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong')
            }
        })
    }

    function startRename(c: CategoryRow) {
        setEditingId(c.id)
        setDraft(c.name)
    }

    function commitRename(c: CategoryRow) {
        const name = draft.trim()
        setEditingId(null)
        if (!name || name === c.name) return
        run(() => updateCategory(c.id, { name }))
    }

    function handleDelete(c: CategoryRow) {
        const detail = c.objectCount > 0
            ? `${c.objectCount} object${c.objectCount === 1 ? '' : 's'} will become uncategorized.`
            : 'No objects use this category.'
        if (!confirm(`Delete category “${c.name}”? ${detail}`)) return
        run(() => deleteCategory(c.id))
    }

    function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        const name = newName.trim()
        if (!name) return
        setNewName('')
        run(() => createCategory({ name }))
    }

    return (
        <section className="space-y-4 border-t pt-6">
            <div>
                <h2 className="font-serif text-lg font-medium">Categories</h2>
                <p className="text-sm text-muted-foreground">
                    Used to classify objects. Deleting a category leaves its objects uncategorized.
                </p>
            </div>

            {error && (
                <p className="bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <div className="divide-y border-y">
                {categories.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground/80">No categories yet.</p>
                )}
                {categories.map((c) => (
                    <div key={c.id} className="group flex items-center gap-2 py-2">
                        {editingId === c.id ? (
                            <>
                                <Input
                                    autoFocus
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitRename(c)
                                        if (e.key === 'Escape') setEditingId(null)
                                    }}
                                    className="h-8 max-w-xs"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={isPending}
                                    onClick={() => commitRename(c)}
                                    aria-label="Save name"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setEditingId(null)}
                                    aria-label="Cancel rename"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <span className="flex-1 truncate text-sm">{c.name}</span>
                                <span className="text-xs tabular-nums text-muted-foreground/70">
                                    {c.objectCount} object{c.objectCount === 1 ? '' : 's'}
                                </span>
                                {canEdit && (
                                    <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            disabled={isPending}
                                            onClick={() => startRename(c)}
                                            aria-label={`Rename ${c.name}`}
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            disabled={isPending}
                                            onClick={() => handleDelete(c)}
                                            aria-label={`Delete ${c.name}`}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {canEdit && (
                <form onSubmit={handleAdd} className="flex items-center gap-2">
                    <Input
                        placeholder="New category"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 max-w-xs"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={isPending || !newName.trim()}>
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                    </Button>
                </form>
            )}
        </section>
    )
}
