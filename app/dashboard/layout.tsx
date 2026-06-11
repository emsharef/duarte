import { Sidebar } from '@/components/sidebar'
import { getWorkspaceContext } from '@/lib/workspace'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const ctx = await getWorkspaceContext()

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar
                memberships={ctx.memberships}
                activeWorkspaceId={ctx.workspaceId}
                userEmail={ctx.userEmail ?? ''}
            />
            <main className="flex-1 overflow-y-auto">
                <div className="h-full px-10 py-8">{children}</div>
            </main>
        </div>
    )
}
