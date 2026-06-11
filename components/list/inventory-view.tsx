'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { SortingState } from '@tanstack/react-table'
import { Bookmark, LayoutGrid, Search, Settings2, Table2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArtworkTable } from '@/components/artwork-table'
import { buildColumns } from '@/components/columns'
import { BatchTray } from '@/components/list/batch-tray'
import { ColumnSettingsDialog } from '@/components/list/column-settings-dialog'
import { GalleryGrid } from '@/components/list/gallery-grid'
import { deleteView, saveView, type SavedView } from '@/app/actions/views'
import {
    DEFAULT_PAGE_SIZE,
    DEFAULT_VISIBLE_COLUMNS,
    SEARCH_FIELDS,
    getListColumn,
    type GridRow,
    type SavedViewConfig,
    type ViewSort,
} from '@/lib/list-columns'

type InventoryViewProps = {
    rows: GridRow[]
    savedViews: SavedView[]
    groups: { id: string; name: string }[]
    defaultCurrency: string
    canEdit: boolean
    mode: 'table' | 'gallery'
    initialSearch: string
    initialSearchField: string
}

function parseViewConfig(config: unknown): SavedViewConfig | null {
    if (!config || typeof config !== 'object') return null
    const c = config as Record<string, unknown>
    const columns = Array.isArray(c.columns)
        ? c.columns.filter((k): k is string => typeof k === 'string' && !!getListColumn(k))
        : []
    if (columns.length === 0) return null
    const sort =
        c.sort && typeof c.sort === 'object' && typeof (c.sort as ViewSort)?.id === 'string'
            ? (c.sort as Exclude<ViewSort, null>)
            : null
    const pageSize = typeof c.pageSize === 'number' && c.pageSize > 0 ? c.pageSize : DEFAULT_PAGE_SIZE
    return { columns, sort, pageSize }
}

export function InventoryView({
    rows,
    savedViews,
    groups,
    defaultCurrency,
    canEdit,
    mode,
    initialSearch,
    initialSearchField,
}: InventoryViewProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS)
    const [sorting, setSorting] = useState<SortingState>([])
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [activeViewId, setActiveViewId] = useState<string | null>(null)
    const [columnsOpen, setColumnsOpen] = useState(false)
    const [search, setSearch] = useState(initialSearch)
    const [searchField, setSearchField] = useState(initialSearchField || 'all')

    const columns = useMemo(
        () => buildColumns(visibleColumns, defaultCurrency),
        [visibleColumns, defaultCurrency]
    )

    function updateParams(mutate: (params: URLSearchParams) => void) {
        const params = new URLSearchParams(searchParams.toString())
        mutate(params)
        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    function submitSearch() {
        updateParams((params) => {
            if (search.trim()) {
                params.set('q', search.trim())
                params.set('field', searchField)
            } else {
                params.delete('q')
                params.delete('field')
            }
        })
    }

    function setMode(next: 'table' | 'gallery') {
        updateParams((params) => {
            if (next === 'gallery') params.set('mode', 'gallery')
            else params.delete('mode')
        })
    }

    function applyView(view: SavedView) {
        const config = parseViewConfig(view.config)
        if (!config) {
            window.alert('This saved view is empty or invalid')
            return
        }
        setVisibleColumns(config.columns)
        setSorting(config.sort ? [config.sort] : [])
        setPageSize(config.pageSize)
        setActiveViewId(view.id)
    }

    function resetView() {
        setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
        setSorting([])
        setPageSize(DEFAULT_PAGE_SIZE)
        setActiveViewId(null)
    }

    async function handleSaveView(name: string, cols: string[], size: number) {
        const sort: ViewSort = sorting[0] ? { id: sorting[0].id, desc: sorting[0].desc } : null
        const view = await saveView(name, { columns: cols, sort, pageSize: size })
        setVisibleColumns(cols)
        setPageSize(size)
        setActiveViewId(view.id)
        router.refresh()
    }

    async function handleDeleteView(view: SavedView) {
        try {
            await deleteView(view.id)
            if (activeViewId === view.id) setActiveViewId(null)
            router.refresh()
        } catch (err) {
            console.error('Failed to delete view:', err)
            window.alert(err instanceof Error ? err.message : 'Failed to delete view')
        }
    }

    const activeView = savedViews.find((v) => v.id === activeViewId)

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {/* Scoped search */}
                <Select value={searchField} onValueChange={setSearchField}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SEARCH_FIELDS.map((f) => (
                            <SelectItem key={f.key} value={f.key}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                    <Input
                        placeholder="Search…"
                        className="w-48"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submitSearch()
                        }}
                    />
                    <Button variant="outline" size="icon" onClick={submitSearch} aria-label="Search">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <BatchTray rows={rows} visibleKeys={visibleColumns} canEdit={canEdit} groups={groups} />

                    {/* View switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Bookmark className="mr-1.5 h-4 w-4" />
                                {activeView ? activeView.name : 'Views'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
                            <DropdownMenuItem onClick={resetView}>Default</DropdownMenuItem>
                            {savedViews.map((view) => (
                                <DropdownMenuItem key={view.id} onClick={() => applyView(view)}>
                                    {view.name}
                                </DropdownMenuItem>
                            ))}
                            {savedViews.length === 0 && (
                                <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
                            )}
                            {canEdit && savedViews.length > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Delete view
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {savedViews.map((view) => (
                                                <DropdownMenuItem
                                                    key={view.id}
                                                    onClick={() => handleDeleteView(view)}
                                                >
                                                    {view.name}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="sm" onClick={() => setColumnsOpen(true)}>
                        <Settings2 className="mr-1.5 h-4 w-4" />
                        Columns
                    </Button>

                    {/* Table / gallery toggle */}
                    <div className="flex rounded-md border">
                        <Button
                            variant={mode === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="rounded-r-none"
                            onClick={() => setMode('table')}
                            aria-label="Table view"
                        >
                            <Table2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={mode === 'gallery' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="rounded-l-none"
                            onClick={() => setMode('gallery')}
                            aria-label="Gallery view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {mode === 'gallery' ? (
                <GalleryGrid rows={rows} canEdit={canEdit} />
            ) : (
                <ArtworkTable
                    columns={columns}
                    data={rows}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    pageSize={pageSize}
                    visibleKeys={visibleColumns}
                    defaultCurrency={defaultCurrency}
                    canEdit={canEdit}
                />
            )}

            <ColumnSettingsDialog
                open={columnsOpen}
                onOpenChange={setColumnsOpen}
                visible={visibleColumns}
                pageSize={pageSize}
                canEdit={canEdit}
                onApply={(cols, size) => {
                    setVisibleColumns(cols)
                    setPageSize(size)
                }}
                onSaveView={handleSaveView}
            />
        </div>
    )
}
