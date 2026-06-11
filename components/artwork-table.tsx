'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
    ColumnDef,
    OnChangeFn,
    SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { ListTableMeta } from '@/components/columns'
import { formatMoney, getListColumn, type GridRow } from '@/lib/list-columns'

const CTX_CAP = 200

type ArtworkTableProps = {
    columns: ColumnDef<GridRow>[]
    data: GridRow[]
    sorting: SortingState
    onSortingChange: OnChangeFn<SortingState>
    pageSize: number
    visibleKeys: string[]
    defaultCurrency: string
    canEdit: boolean
}

export function ArtworkTable({
    columns,
    data,
    sorting,
    onSortingChange,
    pageSize,
    visibleKeys,
    defaultCurrency,
    canEdit,
}: ArtworkTableProps) {
    const router = useRouter()
    const ctxRef = useRef('')
    const [pageIndex, setPageIndex] = useState(0)

    useEffect(() => {
        setPageIndex(0)
    }, [pageSize])

    // Clamp the page index if the data shrinks (filter change, deletes)
    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(data.length / pageSize) - 1)
        setPageIndex((p) => Math.min(p, maxPage))
    }, [data.length, pageSize])

    const meta = useMemo<ListTableMeta>(() => ({ ctxRef, canEdit }), [canEdit])

    const table = useReactTable({
        data,
        columns,
        state: { sorting, pagination: { pageIndex, pageSize } },
        onSortingChange,
        onPaginationChange: (updater) => {
            const next = typeof updater === 'function'
                ? updater({ pageIndex, pageSize })
                : updater
            setPageIndex(next.pageIndex)
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta,
    })

    // Ordered ids of the current result page, carried to the detail page for prev/next
    const pageRows = table.getRowModel().rows
    const ctxIds = pageRows
        .map((r) => r.original.id)
        .filter((id): id is string => !!id)
        .slice(0, CTX_CAP)
    ctxRef.current = ctxIds.length ? `?ctx=${ctxIds.join(',')}` : ''

    // Footer totals for visible domestic-currency money columns
    const domesticKeys = visibleKeys.filter((k) => getListColumn(k)?.domesticKey)
    const totals = useMemo(() => {
        const sums: Record<string, number> = {}
        for (const key of domesticKeys) {
            const def = getListColumn(key)
            if (!def?.domesticKey) continue
            sums[key] = data.reduce((acc, row) => acc + ((row[def.domesticKey!] as number | null) ?? 0), 0)
        }
        return sums
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, visibleKeys.join(',')])

    const pageCount = table.getPageCount()

    return (
        <div className="space-y-3">
            <div className="border-y">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className={cn(
                                            header.column.id === 'select' && 'w-8',
                                            header.column.id === 'image' && 'w-12',
                                            header.column.id === 'actions' && 'w-10'
                                        )}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {pageRows.length ? (
                            pageRows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        // Don't navigate if clicking on a link, button or checkbox
                                        const target = e.target as HTMLElement
                                        if (target.closest('a') || target.closest('button') || target.closest('input')) return
                                        router.push(`/dashboard/objects/${row.original.id}${ctxRef.current}`)
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-3">
                                    <EmptyState text="No objects match the current filters." />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {domesticKeys.length > 0 && data.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                {table.getAllLeafColumns().map((column, idx) => {
                                    const def = getListColumn(column.id)
                                    return (
                                        <TableCell key={column.id} className="font-medium">
                                            {idx === 0 ? (
                                                <span className="whitespace-nowrap text-xs text-muted-foreground">
                                                    Total ({defaultCurrency})
                                                </span>
                                            ) : def?.domesticKey ? (
                                                <div className="text-right tabular-nums">
                                                    {formatMoney(totals[column.id] ?? 0, defaultCurrency)}
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                <div>
                    {data.length} object{data.length === 1 ? '' : 's'}
                    {pageCount > 1 && ` · Page ${pageIndex + 1} of ${pageCount}`}
                </div>
                {pageCount > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
