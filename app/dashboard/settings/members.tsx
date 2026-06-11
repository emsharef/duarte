'use client'

import { useState, useTransition } from 'react'
import { Copy, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createInvite, revokeInvite, updateMemberRole, removeMember } from './actions'
import type { WorkspaceRole } from '@/lib/workspace'

type Member = { user_id: string; role: string; created_at: string; email: string }
type Invite = { id: string; email: string; role: string; token: string; created_at: string }

const ROLES: WorkspaceRole[] = ['owner', 'editor', 'viewer']

function inviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`
}

export function MembersPanel({
    members,
    invites,
    currentUserId,
    isOwner,
}: {
    members: Member[]
    invites: Invite[]
    currentUserId: string
    isOwner: boolean
}) {
    const [isPending, startTransition] = useTransition()
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<WorkspaceRole>('editor')
    const [createdLink, setCreatedLink] = useState<string | null>(null)
    const [copiedToken, setCopiedToken] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    function run(fn: () => Promise<unknown>) {
        setError(null)
        startTransition(async () => {
            try {
                await fn()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong')
            }
        })
    }

    function copy(token: string) {
        navigator.clipboard.writeText(inviteUrl(token))
        setCopiedToken(token)
        setTimeout(() => setCopiedToken(null), 2000)
    }

    return (
        <div className="space-y-8">
            {error && (
                <p className="bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <section className="space-y-4 border-t pt-6">
                <h2 className="font-serif text-lg font-medium">Members</h2>
                <div className="divide-y border-y">
                    {members.map((m) => (
                        <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 truncate text-sm">
                                {m.email}
                                {m.user_id === currentUserId && (
                                    <span className="ml-2 text-xs text-muted-foreground/70">(you)</span>
                                )}
                            </div>
                            {isOwner && m.user_id !== currentUserId ? (
                                <>
                                    <Select
                                        value={m.role}
                                        onValueChange={(role) =>
                                            run(() => updateMemberRole(m.user_id, role as WorkspaceRole))
                                        }
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="w-28">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        onClick={() => run(() => removeMember(m.user_id))}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </>
                            ) : (
                                <span className="text-sm text-muted-foreground">{m.role}</span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {isOwner && (
                <section className="space-y-4 border-t pt-6">
                    <h2 className="font-serif text-lg font-medium">Invite someone</h2>
                    <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!inviteEmail) return
                            run(async () => {
                                const { token } = await createInvite(inviteEmail, inviteRole)
                                setCreatedLink(inviteUrl(token))
                                setInviteEmail('')
                            })
                        }}
                    >
                        <Input
                            type="email"
                            placeholder="email@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="max-w-xs"
                        />
                        <Select value={inviteRole} onValueChange={(r) => setInviteRole(r as WorkspaceRole)}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" disabled={isPending || !inviteEmail}>
                            Create invite
                        </Button>
                    </form>
                    {createdLink && (
                        <p className="border-l-2 border-primary/30 bg-muted/40 px-3 py-2 text-sm text-foreground/85">
                            Share this link: <code className="break-all">{createdLink}</code>{' '}
                            (no email is sent — the invitee must log in with the invited address)
                        </p>
                    )}

                    {invites.length > 0 && (
                        <div className="divide-y border-y">
                            {invites.map((inv) => (
                                <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex-1 truncate text-sm">
                                        {inv.email}
                                        <span className="ml-2 text-xs text-muted-foreground/70">{inv.role} · pending</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => copy(inv.token)}>
                                        {copiedToken === inv.token ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        onClick={() => run(() => revokeInvite(inv.id))}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
