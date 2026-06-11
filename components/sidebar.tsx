'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutGrid,
    Users,
    MapPin,
    Settings,
    PlusCircle,
    Contact,
    ShoppingCart,
    Shield,
    DollarSign,
    Receipt,
    ArrowLeftRight,
    FileText,
    LogOut
} from 'lucide-react'
import { logout } from '@/app/login/actions'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/workspace-switcher'

type Membership = { workspace_id: string; role: string; name: string }

const navigation = [
    { name: 'Inventory', href: '/dashboard', icon: LayoutGrid },
    { name: 'Artists', href: '/dashboard/artists', icon: Users },
    { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Contact },
    { name: 'Acquisitions', href: '/dashboard/acquisitions', icon: ShoppingCart },
    { name: 'Valuations', href: '/dashboard/valuations', icon: DollarSign },
    { name: 'Insurance', href: '/dashboard/insurance', icon: Shield },
    { name: 'Loans', href: '/dashboard/loans', icon: ArrowLeftRight },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({
    memberships,
    activeWorkspaceId,
    userEmail,
}: {
    memberships: Membership[]
    activeWorkspaceId: string
    userEmail: string
}) {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center px-6">
                <span className="font-serif text-xl font-semibold tracking-tight text-white">
                    DuArte
                </span>
            </div>

            <div className="border-b border-sidebar-border px-3 pb-3">
                <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />
            </div>

            <div className="px-3 pt-4 pb-2">
                <Link
                    href="/dashboard/objects/new"
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
                >
                    <PlusCircle className="h-4 w-4" />
                    Add Object
                </Link>
            </div>

            <nav className="flex-1 space-y-px overflow-y-auto px-3 py-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center rounded-md px-3 py-1.5 text-[13px] transition-colors',
                                isActive
                                    ? 'bg-sidebar-accent font-medium text-white'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-4 w-4 flex-shrink-0',
                                    isActive
                                        ? 'text-primary-foreground/90'
                                        : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                                )}
                            />
                            <span className="flex-1">{item.name}</span>
                            {isActive && <span className="ml-2 h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.11_25)]" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-sidebar-border px-4 py-3">
                <form action={logout} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-sidebar-foreground/50" title={userEmail}>
                        {userEmail}
                    </span>
                    <button
                        type="submit"
                        title="Sign out"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}
