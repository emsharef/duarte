import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const WORKSPACE_COOKIE = 'duarte-workspace'

export type WorkspaceRole = 'owner' | 'editor' | 'viewer'

export type WorkspaceMembership = {
    workspace_id: string
    role: WorkspaceRole
    name: string
}

export type WorkspaceContext = {
    supabase: Awaited<ReturnType<typeof createClient>>
    userId: string
    userEmail: string | undefined
    workspaceId: string
    role: WorkspaceRole
    memberships: WorkspaceMembership[]
}

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: rows } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(name)')
        .eq('user_id', user.id)

    let memberships: WorkspaceMembership[] = (rows ?? []).map((r) => ({
        workspace_id: r.workspace_id,
        role: r.role as WorkspaceRole,
        name: r.workspaces?.name ?? 'Workspace',
    }))

    if (memberships.length === 0) {
        const { data: wsId, error } = await supabase.rpc('ensure_personal_workspace')
        if (error || !wsId) throw new Error(error?.message ?? 'Could not create workspace')
        memberships = [{ workspace_id: wsId, role: 'owner', name: 'My Collection' }]
    }

    const cookieStore = await cookies()
    const requested = cookieStore.get(WORKSPACE_COOKIE)?.value
    const active = memberships.find((m) => m.workspace_id === requested) ?? memberships[0]

    return {
        supabase,
        userId: user.id,
        userEmail: user.email,
        workspaceId: active.workspace_id,
        role: active.role,
        memberships,
    }
}

export function requireEdit(ctx: Pick<WorkspaceContext, 'role'>) {
    if (ctx.role === 'viewer') throw new Error('You have read-only access to this workspace')
}

export function requireOwner(ctx: Pick<WorkspaceContext, 'role'>) {
    if (ctx.role !== 'owner') throw new Error('Only the workspace owner can do this')
}
