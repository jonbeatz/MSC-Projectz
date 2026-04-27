'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { msc_verifyEmailAction } from '@/app/actions/verify-email'

type VerificationState = 'success' | 'error' | 'expired' | 'loading'

type VerificationViewProps = {
  token?: string
  forceState?: VerificationState
}

function msc_stateMessage(state: VerificationState): string {
  if (state === 'success') return 'Email verified successfully. Redirecting to login...'
  if (state === 'expired') return 'Verification link is invalid or expired.'
  if (state === 'error') return 'Unable to verify this email right now. Please try again.'
  return 'Verifying your email...'
}

export function VerificationView({ token = '', forceState }: VerificationViewProps) {
  const router = useRouter()
  const [state, setState] = useState<VerificationState>(forceState || 'loading')
  const [message, setMessage] = useState(msc_stateMessage(forceState || 'loading'))

  useEffect(() => {
    if (forceState) {
      setState(forceState)
      setMessage(msc_stateMessage(forceState))
      return
    }

    const cleanToken = token.trim()
    if (!cleanToken) {
      setState('expired')
      setMessage('Missing verification token. Please request a new verification email.')
      return
    }

    let mounted = true
    setState('loading')
    setMessage(msc_stateMessage('loading'))
    void msc_verifyEmailAction(cleanToken).then((result) => {
      if (!mounted) return
      if (result.ok) {
        setState('success')
        setMessage(result.message)
        window.setTimeout(() => router.push('/auth'), 1400)
        return
      }

      const lowered = result.message.toLowerCase()
      const nextState = lowered.includes('expired') || lowered.includes('invalid') ? 'expired' : 'error'
      setState(nextState)
      setMessage(result.message)
    })
    return () => {
      mounted = false
    }
  }, [forceState, router, token])

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center">
        <section className="w-full rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            MSC-Projectz
          </p>
          <h1 className="mt-3 text-xl font-semibold">Email Verification</h1>

          <div className="mt-5 flex items-center justify-center">
            {state === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {state === 'success' && <CheckCircle2 className="h-6 w-6 text-primary" />}
            {(state === 'error' || state === 'expired') && <XCircle className="h-6 w-6 text-destructive" />}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{message}</p>

          <div className="mt-6">
            <Link href="/auth" className="text-sm font-medium text-primary hover:underline">
              Return to sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
