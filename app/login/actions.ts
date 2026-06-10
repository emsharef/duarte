'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?error=true')
    }

    revalidatePath('/', 'layout')
    const next = formData.get('next') as string | null
    redirect(next && next.startsWith('/') ? next : '/dashboard')
}

export async function loginWithGoogle(formData: FormData) {
    const supabase = await createClient()
    const next = formData.get('next') as string | null
    const origin = (await headers()).get('origin')

    const callback = `${origin}/auth/callback${
        next && next.startsWith('/') ? `?next=${encodeURIComponent(next)}` : ''
    }`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback },
    })

    if (error || !data.url) {
        redirect('/login?error=true')
    }

    redirect(data.url)
}
