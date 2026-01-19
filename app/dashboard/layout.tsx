import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto border-l border-gray-200">
                <div className="h-full px-8 py-6">{children}</div>
            </main>
        </div>
    )
}
