'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/sidebar'

type Membership = { workspace_id: string; role: string; name: string }

export function MobileNav({
    memberships,
    activeWorkspaceId,
    userEmail,
}: {
    memberships: Membership[]
    activeWorkspaceId: string
    userEmail: string
}) {
    const [open, setOpen] = useState(false)

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button
                        type="button"
                        aria-label="Open navigation"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
                >
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Sidebar
                        memberships={memberships}
                        activeWorkspaceId={activeWorkspaceId}
                        userEmail={userEmail}
                        onNavigate={() => setOpen(false)}
                    />
                </SheetContent>
            </Sheet>
            <span className="font-serif text-lg font-semibold tracking-tight text-white">
                DūArte
            </span>
        </header>
    )
}
