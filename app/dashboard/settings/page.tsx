import { getWorkspaceContext } from '@/lib/workspace'
import { MembersPanel } from './members'
import { WorkspaceSettings } from './workspace-settings'

export default async function SettingsPage() {
    const ctx = await getWorkspaceContext()

    const [{ data: members }, { data: invites }, { data: emails }, { data: workspace }] = await Promise.all([
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
    ])

    const emailMap = new Map((emails ?? []).map((e) => [e.user_id, e.email]))
    const membersWithEmail = (members ?? []).map((m) => ({
        ...m,
        email: emailMap.get(m.user_id) ?? m.user_id.slice(0, 8),
    }))

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-gray-500">Manage this workspace and its members.</p>
            </div>
            {ctx.role === 'owner' && (
                <WorkspaceSettings
                    accessionPrefix={workspace?.accession_prefix ?? null}
                    defaultCurrency={workspace?.default_currency ?? 'USD'}
                />
            )}
            <MembersPanel
                members={membersWithEmail}
                invites={invites ?? []}
                currentUserId={ctx.userId}
                isOwner={ctx.role === 'owner'}
            />
        </div>
    )
}
