import { Sidebar } from '@/components/sidebar'
import { getWorkspaceContext } from '@/lib/workspace'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const ctx = await getWorkspaceContext()

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar
                memberships={ctx.memberships}
                activeWorkspaceId={ctx.workspaceId}
                userEmail={ctx.userEmail ?? ''}
            />
            <main className="flex-1 overflow-y-auto border-l border-gray-200">
                <div className="h-full px-8 py-6">{children}</div>
            </main>
        </div>
    )
}
