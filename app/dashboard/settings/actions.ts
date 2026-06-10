'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspaceContext, requireOwner, type WorkspaceRole } from '@/lib/workspace'

export async function createInvite(email: string, role: WorkspaceRole) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    const { data, error } = await ctx.supabase
        .from('workspace_invites')
        .insert({ workspace_id: ctx.workspaceId, email, role, invited_by: ctx.userId })
        .select('token')
        .single()
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
    return { token: data.token }
}

export async function revokeInvite(inviteId: string) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    const { error } = await ctx.supabase
        .from('workspace_invites')
        .delete()
        .eq('id', inviteId)
        .eq('workspace_id', ctx.workspaceId)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function updateMemberRole(userId: string, role: WorkspaceRole) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    if (userId === ctx.userId) throw new Error('Owners cannot change their own role')
    const { error } = await ctx.supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', ctx.workspaceId)
        .eq('user_id', userId)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function removeMember(userId: string) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    if (userId === ctx.userId) throw new Error('Owners cannot remove themselves')
    const { error } = await ctx.supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', ctx.workspaceId)
        .eq('user_id', userId)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function renameWorkspace(name: string) {
    const ctx = await getWorkspaceContext()
    requireOwner(ctx)
    const { error } = await ctx.supabase
        .from('workspaces')
        .update({ name })
        .eq('id', ctx.workspaceId)
    if (error) throw new Error(error.message)
    revalidatePath('/', 'layout')
}
