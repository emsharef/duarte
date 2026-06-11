'use client'

import { ColumnDef, Table as TanstackTable } from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSelection } from '@/components/list/selection'
import { StatusChip } from '@/components/list/status-chip'
import {
    formatMoney,
    getListColumn,
    gridCellValue,
    type GridRow,
    type ListColumnDef,
} from '@/lib/list-columns'

// Shared table meta: ctxRef carries the ?ctx= query string for the current page
export type ListTableMeta = {
    ctxRef: { current: string }
    canEdit: boolean
}

function rowIds(table: TanstackTable<GridRow>, all: boolean): string[] {
    const rows = all ? table.getPrePaginationRowModel().rows : table.getRowModel().rows
    return rows.map((r) => r.original.id).filter((id): id is string => !!id)
}

function SelectHeader({ table }: { table: TanstackTable<GridRow> }) {
    const selection = useSelection()
    const pageIds = rowIds(table, false)
    const allOnPage = pageIds.length > 0 && pageIds.every((id) => selection.has(id))

    return (
        <div className="flex items-center gap-0.5">
            <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-primary"
                aria-label="Select page"
                checked={allOnPage}
                onChange={() => (allOnPage ? selection.remove(pageIds) : selection.add(pageIds))}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" className="rounded p-0.5 hover:bg-accent" aria-label="Selection options">
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => selection.add(rowIds(table, true))}>
                        Select all ({table.getPrePaginationRowModel().rows.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => selection.add(pageIds)}>
                        Select page ({pageIds.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => selection.clear()}>
                        Select none
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function SelectCell({ id }: { id: string }) {
    const selection = useSelection()
    return (
        <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-primary"
            aria-label="Select row"
            checked={selection.has(id)}
            onChange={() => selection.toggle(id)}
            onClick={(e) => e.stopPropagation()}
        />
    )
}

function sortableHeader(def: ListColumnDef): ColumnDef<GridRow>['header'] {
    const Header: ColumnDef<GridRow>['header'] = ({ column }) => {
        const button = (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {def.label}
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            </Button>
        )
        return def.type === 'money' ? <div className="-mr-2 text-right">{button}</div> : button
    }
    return Header
}

function toColumnDef(def: ListColumnDef, defaultCurrency: string): ColumnDef<GridRow> {
    const base: ColumnDef<GridRow> = {
        id: def.key,
        accessorFn: (row) => gridCellValue(row, def),
        header: def.label,
        enableSorting: false,
    }

    switch (def.type) {
        case 'image':
            base.cell = ({ row }) => {
                const url = row.original.signed_url
                if (!url) return <div className="h-10 w-10 rounded-md bg-gray-100" />
                return (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={url}
                        alt={row.original.title ?? ''}
                        className="relative z-10 h-10 w-10 origin-left rounded-md object-cover transition-transform hover:scale-150"
                    />
                )
            }
            break

        case 'status':
            base.cell = ({ row, table }) => {
                const meta = table.options.meta as ListTableMeta
                const obj = row.original
                if (!obj.id) return null
                return <StatusChip objectId={obj.id} status={obj.status ?? ''} canEdit={meta.canEdit} />
            }
            break

        case 'money':
            base.header = sortableHeader(def)
            base.enableSorting = true
            base.cell = ({ row }) => {
                const value = gridCellValue(row.original, def) as number | null
                const currency = def.currencySource
                    ? ((row.original[def.currencySource] as string | null) ?? defaultCurrency)
                    : defaultCurrency
                return (
                    <div className="text-right tabular-nums">{formatMoney(value, currency)}</div>
                )
            }
            break

        case 'date':
            base.header = sortableHeader(def)
            base.enableSorting = true
            base.cell = ({ row }) => {
                const value = gridCellValue(row.original, def) as string | null
                if (!value) return null
                const d = new Date(value)
                return <span className="whitespace-nowrap">{isNaN(d.getTime()) ? value : d.toLocaleDateString()}</span>
            }
            break

        default: // text
            base.header = sortableHeader(def)
            base.enableSorting = true
            base.cell = ({ row, table }) => {
                const value = gridCellValue(row.original, def)
                const text = value == null ? '' : String(value)
                if (def.key === 'title') {
                    const meta = table.options.meta as ListTableMeta
                    return (
                        <Link
                            href={`/dashboard/objects/${row.original.id}${meta.ctxRef.current}`}
                            className="font-medium hover:underline"
                        >
                            {text || 'Untitled'}
                        </Link>
                    )
                }
                return <span className="block max-w-[16rem] truncate">{text}</span>
            }
            break
    }

    return base
}

export function buildColumns(visibleKeys: string[], defaultCurrency: string): ColumnDef<GridRow>[] {
    const cols: ColumnDef<GridRow>[] = [
        {
            id: 'select',
            header: ({ table }) => <SelectHeader table={table} />,
            cell: ({ row }) => (row.original.id ? <SelectCell id={row.original.id} /> : null),
            enableSorting: false,
        },
    ]

    for (const key of visibleKeys) {
        const def = getListColumn(key)
        if (def) cols.push(toColumnDef(def, defaultCurrency))
    }

    cols.push({
        id: 'actions',
        enableSorting: false,
        cell: ({ row, table }) => {
            const obj = row.original
            const meta = table.options.meta as ListTableMeta
            if (!obj.id) return null
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(obj.id!)}>
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/objects/${obj.id}${meta.ctxRef.current}`}>
                                View details
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    })

    return cols
}
