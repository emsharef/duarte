import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/login?next=/invite/${token}`)

    const { data: workspaceId, error } = await supabase.rpc('accept_workspace_invite', {
        invite_token: token,
    })

    if (error || !workspaceId) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-sm text-gray-600">
                    This invite is invalid, already used, or was sent to a different email address.
                </p>
            </div>
        )
    }

    redirect('/dashboard')
}
