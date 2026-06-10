'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateArtist, type Artist } from '@/app/actions/artists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function ArtistForm({ artist }: { artist: Artist }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const data = {
                first_name: formData.get('first_name') as string,
                last_name: formData.get('last_name') as string,
                company: formData.get('company') as string,
                nationality: formData.get('nationality') as string,
                birth_year: formData.get('birth_year') ? parseInt(formData.get('birth_year') as string) : undefined,
                death_year: formData.get('death_year') ? parseInt(formData.get('death_year') as string) : undefined,
                website: formData.get('website') as string,
                aka: formData.get('aka') as string,
                bio: formData.get('bio') as string,
            }
            await updateArtist(artist.id, data)
        } catch (error) {
            console.error('Failed to update artist', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit}>
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input id="first_name" name="first_name" defaultValue={artist.first_name ?? undefined} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input id="last_name" name="last_name" defaultValue={artist.last_name ?? undefined} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="company">Company</Label>
                            <Input id="company" name="company" defaultValue={artist.company ?? undefined} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nationality">Nationality</Label>
                            <Input id="nationality" name="nationality" defaultValue={artist.nationality ?? undefined} placeholder="e.g. Swiss" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="aka">AKA (Aliases)</Label>
                            <Input id="aka" name="aka" defaultValue={artist.aka ?? undefined} placeholder="Alternate names" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="birth_year">Birth Year</Label>
                            <Input id="birth_year" name="birth_year" type="number" defaultValue={artist.birth_year ?? undefined} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="death_year">Death Year</Label>
                            <Input id="death_year" name="death_year" type="number" defaultValue={artist.death_year ?? undefined} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" type="url" defaultValue={artist.website ?? undefined} placeholder="https://..." />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Biography</Label>
                        <Textarea id="bio" name="bio" defaultValue={artist.bio ?? undefined} rows={5} />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
