import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/aihome/dashboard'
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // If there's an error from OAuth provider, redirect to callback page with error
    if (error) {
        const redirectUrl = new URL('/aihome/auth/callback', requestUrl.origin)
        redirectUrl.searchParams.set('error', error)
        if (error_description) {
            redirectUrl.searchParams.set('error_description', error_description)
        }
        return NextResponse.redirect(redirectUrl)
    }

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            console.error('OAuth code exchange failed:', exchangeError)
            const redirectUrl = new URL('/aihome/auth/callback', requestUrl.origin)
            redirectUrl.searchParams.set('error', 'exchange_failed')
            redirectUrl.searchParams.set('error_description', exchangeError.message)
            return NextResponse.redirect(redirectUrl)
        }

        // Successfully exchanged code, redirect to the callback page
        // The callback page will detect the session and redirect to 'next'
        const redirectUrl = new URL('/aihome/auth/callback', requestUrl.origin)
        redirectUrl.searchParams.set('next', next)
        return NextResponse.redirect(redirectUrl)
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/aihome/auth/login', requestUrl.origin))
}
