import { getWorkspaceContext } from '@/lib/workspace'
import { MembersPanel } from './members'
import { WorkspaceSettings } from './workspace-settings'
import { CategoriesPanel } from './categories'

export default async function SettingsPage() {
    const ctx = await getWorkspaceContext()

    const [{ data: members }, { data: invites }, { data: emails }, { data: workspace }, { data: categories }, { data: categoryFacets }] = await Promise.all([
        ctx.supabase
            .from('workspace_members')
            .select('user_id, role, created_at')
            .eq('workspace_id', ctx.workspaceId)
            .order('created_at'),
        ctx.supabase
            .from('workspace_invites')
            .select('id, email, role, token, accepted_at, created_at')
            .eq('workspace_id', ctx.workspaceId)
            .is('accepted_at', null)
            .order('created_at'),
        ctx.supabase.rpc('workspace_member_emails', { ws_id: ctx.workspaceId }),
        ctx.supabase
            .from('workspaces')
            .select('accession_prefix, default_currency')
            .eq('id', ctx.workspaceId)
            .single(),
        ctx.supabase
            .from('categories')
            .select('id, name')
            .eq('workspace_id', ctx.workspaceId)
            .order('name'),
        ctx.supabase
            .from('objects')
            .select('category_id')
            .eq('workspace_id', ctx.workspaceId)
            .not('category_id', 'is', null),
    ])

    const emailMap = new Map((emails ?? []).map((e) => [e.user_id, e.email]))
    const membersWithEmail = (members ?? []).map((m) => ({
        ...m,
        email: emailMap.get(m.user_id) ?? m.user_id.slice(0, 8),
    }))

    const categoryCounts: Record<string, number> = {}
    for (const o of categoryFacets ?? []) {
        if (o.category_id) categoryCounts[o.category_id] = (categoryCounts[o.category_id] ?? 0) + 1
    }
    const categoryRows = (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        objectCount: categoryCounts[c.id] ?? 0,
    }))

    return (
        <div className="max-w-3xl space-y-10">
            <div className="border-b pb-4">
                <h1 className="font-serif text-3xl font-medium tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage this workspace and its members.</p>
            </div>
            {ctx.role === 'owner' && (
                <WorkspaceSettings
                    accessionPrefix={workspace?.accession_prefix ?? null}
                    defaultCurrency={workspace?.default_currency ?? 'USD'}
                />
            )}
            <CategoriesPanel categories={categoryRows} canEdit={ctx.role !== 'viewer'} />
            <MembersPanel
                members={membersWithEmail}
                invites={invites ?? []}
                currentUserId={ctx.userId}
                isOwner={ctx.role === 'owner'}
            />
        </div>
    )
}
