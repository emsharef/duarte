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
import { Button } from '@/components/ui/button'
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
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-lg font-bold tracking-tight">DūArte</span>
            </div>

            <div className="border-b px-3 py-3">
                <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />
            </div>

            <div className="p-4">
                <Link href="/dashboard/objects/new">
                    <Button className="w-full justify-start" variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Object
                    </Button>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
                                isActive
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t px-4 py-3">
                <form action={logout} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-500" title={userEmail}>
                        {userEmail}
                    </span>
                    <button
                        type="submit"
                        title="Sign out"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}
