'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { OBJECT_STATUS_LABELS } from '@/lib/constants'

export type Artwork = {
    id: string
    title: string
    artist_name: string
    year_created: number | null
    status: string
    location?: string | null
    r2_image_key?: string | null
    signedUrl?: string | null
}

export const columns: ColumnDef<Artwork>[] = [
    {
        accessorKey: 'signedUrl',
        header: 'Image',
        cell: ({ row }) => {
            const url = row.getValue('signedUrl') as string
            if (!url) return <div className="h-10 w-10 bg-gray-100 rounded-md" />
            return (
                <img
                    src={url}
                    alt={row.getValue('title')}
                    className="h-10 w-10 object-cover rounded-md hover:scale-150 transition-transform origin-left z-10 relative"
                />
            )
        },
    },
    {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
            const artwork = row.original
            return (
                <Link href={`/dashboard/objects/${artwork.id}`} className="font-medium hover:underline">
                    {row.getValue('title')}
                </Link>
            )
        },
    },
    {
        accessorKey: 'artist_name',
        header: 'Artist',
    },
    {
        accessorKey: 'year_created',
        header: 'Year',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string
            return (
                <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status === 'in_collection'
                            ? 'bg-green-100 text-green-800'
                            : status === 'sold'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                >
                    {OBJECT_STATUS_LABELS[status] ?? status}
                </div>
            )
        },
    },
    {
        accessorKey: 'location',
        header: 'Location',
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const artwork = row.original

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
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(artwork.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/objects/${artwork.id}`}>
                                View details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/objects/${artwork.id}`}>
                                Edit artwork
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
