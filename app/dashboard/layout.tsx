import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { getWorkspaceContext } from '@/lib/workspace'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const ctx = await getWorkspaceContext()

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
            <aside className="hidden w-60 shrink-0 md:flex">
                <Sidebar
                    memberships={ctx.memberships}
                    activeWorkspaceId={ctx.workspaceId}
                    userEmail={ctx.userEmail ?? ''}
                />
            </aside>
            <MobileNav
                memberships={ctx.memberships}
                activeWorkspaceId={ctx.workspaceId}
                userEmail={ctx.userEmail ?? ''}
            />
            <main className="flex-1 overflow-y-auto overscroll-contain">
                <div className="min-h-full px-4 py-5 md:px-10 md:py-8">{children}</div>
            </main>
        </div>
    )
}
