import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const origin = requestUrl.origin

  const supabase = await createClient()

  if (code) {
    // magic link and oauth flow
    await supabase.auth.exchangeCodeForSession(code)
  } else if (tokenHash && type) {
    // email confirmation flow
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  }

  return NextResponse.redirect(`${origin}/chat`)
}
