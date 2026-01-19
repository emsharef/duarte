'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createArtwork(formData: FormData) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const title = formData.get('title') as string
    const artist_name = formData.get('artist_name') as string
    const year_created = formData.get('year_created') ? parseInt(formData.get('year_created') as string) : null
    const status = formData.get('status') as string
    const location = formData.get('location') as string
    const r2_image_key = formData.get('r2_image_key') as string

    const { error } = await supabase.from('artworks').insert({
        user_id: user.id,
        title,
        artist_name,
        year_created,
        status,
        location,
        r2_image_key,
    })

    if (error) {
        console.error('Error creating artwork:', error)
        throw new Error('Failed to create artwork')
    }

    revalidatePath('/dashboard')
}
