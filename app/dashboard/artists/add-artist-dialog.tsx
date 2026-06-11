'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createArtist } from '@/app/actions/artists'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddArtistDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const text = (key: string) => ((form.get(key) as string) || '').trim() || null
        const year = (key: string) => {
            const v = text(key)
            if (!v) return null
            const n = Number(v)
            return Number.isFinite(n) ? n : null
        }

        setSaving(true)
        setError(null)
        try {
            await createArtist({
                first_name: text('first_name'),
                last_name: text('last_name'),
                company: text('company'),
                nationality: text('nationality'),
                birth_year: year('birth_year'),
                death_year: year('death_year'),
            })
            setOpen(false)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create artist')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); setError(null) }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Artist
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif">Add Artist</DialogTitle>
                    <DialogDescription>
                        Create a new artist profile. You can add more details later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="artist-first-name">First name</Label>
                            <Input id="artist-first-name" name="first_name" autoFocus />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="artist-last-name">Last name</Label>
                            <Input id="artist-last-name" name="last_name" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="artist-company">Company</Label>
                        <Input id="artist-company" name="company" placeholder="Studio or estate, if applicable" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="artist-nationality">Nationality</Label>
                        <Input id="artist-nationality" name="nationality" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="artist-birth-year">Birth year</Label>
                            <Input id="artist-birth-year" name="birth_year" type="number" inputMode="numeric" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="artist-death-year">Death year</Label>
                            <Input id="artist-death-year" name="death_year" type="number" inputMode="numeric" />
                        </div>
                    </div>
                    {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Add Artist'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
