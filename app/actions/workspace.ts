'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getWorkspaceContext, WORKSPACE_COOKIE } from '@/lib/workspace'

export async function setActiveWorkspace(workspaceId: string) {
    const ctx = await getWorkspaceContext()
    if (!ctx.memberships.some((m) => m.workspace_id === workspaceId)) {
        throw new Error('Not a member of that workspace')
    }
    const cookieStore = await cookies()
    cookieStore.set(WORKSPACE_COOKIE, workspaceId, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function createWorkspace(name: string) {
    const ctx = await getWorkspaceContext()
    const { data: workspaceId, error } = await ctx.supabase.rpc('create_workspace', {
        ws_name: name,
    })
    if (error || !workspaceId) throw new Error(error?.message ?? 'Could not create workspace')
    await setActiveWorkspace(workspaceId)
}
