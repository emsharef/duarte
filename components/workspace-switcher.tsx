'use client'

import { useTransition } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { setActiveWorkspace } from '@/app/actions/workspace'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type Membership = { workspace_id: string; role: string; name: string }

export function WorkspaceSwitcher({
    memberships,
    activeWorkspaceId,
}: {
    memberships: Membership[]
    activeWorkspaceId: string
}) {
    const [isPending, startTransition] = useTransition()
    const active = memberships.find((m) => m.workspace_id === activeWorkspaceId)

    if (memberships.length <= 1) {
        return (
            <div className="px-3 py-2 text-sm font-medium text-gray-700 truncate">
                {active?.name ?? 'Workspace'}
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={isPending}>
                    <span className="truncate">{active?.name ?? 'Workspace'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {memberships.map((m) => (
                    <DropdownMenuItem
                        key={m.workspace_id}
                        onSelect={() => startTransition(() => setActiveWorkspace(m.workspace_id))}
                    >
                        <Check
                            className={cn(
                                'mr-2 h-4 w-4',
                                m.workspace_id === activeWorkspaceId ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                        <span className="truncate">{m.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{m.role}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
