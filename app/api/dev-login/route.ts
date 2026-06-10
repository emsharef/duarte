import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Development-only auto-login for local testing (e.g. browser automation).
// Signs in with the test credentials from .env.local. Returns 404 outside dev.
// Optional ?as=2 uses the secondary test account (DUARTE_TEST_LOGIN2/PASS2).
export async function GET(request: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { searchParams, origin } = new URL(request.url)
    const useSecondary = searchParams.get('as') === '2'
    const email = useSecondary ? process.env.DUARTE_TEST_LOGIN2 : process.env.DUARTE_TEST_LOGIN
    const password = useSecondary ? process.env.DUARTE_TEST_PASS2 : process.env.DUARTE_TEST_PASS

    if (!email || !password) {
        return NextResponse.json({ error: 'Test credentials not configured in .env.local' }, { status: 500 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
