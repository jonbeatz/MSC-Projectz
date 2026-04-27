'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { msc_setDevTrustBypass } from '@/app/actions/dev-trust-bypass'
import { msc_resendVerificationAction } from '@/app/actions/resend-verification'
import { Button } from '@/components/ui/button'

type Props = {
  maskedEmail: string
  canUseDevBypass: boolean
}

export function MSC_Projectz_VerifyReminderClient({ maskedEmail, canUseDevBypass }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bypassLoading, setBypassLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)

  const msc_tickCooldown = (seconds: number) => {
    setCooldownSeconds(seconds)
    let remaining = seconds
    const timer = window.setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        window.clearInterval(timer)
        setCooldownSeconds(0)
        return
      }
      setCooldownSeconds(remaining)
    }, 1000)
  }

  const msc_onResend = async () => {
    if (loading || cooldownSeconds > 0) return
    setLoading(true)
    setMessage(null)
    setMessageType(null)
    const result = await msc_resendVerificationAction()
    setLoading(false)
    setMessage(result.message)
    setMessageType(result.ok ? 'success' : 'error')
    if (result.cooldownSeconds && result.cooldownSeconds > 0) {
      msc_tickCooldown(result.cooldownSeconds)
    }
  }

  const msc_onEnableDevBypass = async () => {
    if (bypassLoading) return
    setBypassLoading(true)
    const result = await msc_setDevTrustBypass(true)
    setBypassLoading(false)
    setMessage(result.message)
    setMessageType(result.ok ? 'success' : 'error')
    if (result.ok) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <section className="w-full rounded-xl border border-border bg-card p-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Trust Gate
      </p>
      <h1 className="mt-3 text-xl font-semibold text-foreground">Verify your email to continue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please verify your email to access the Vault. We sent a verification link to{' '}
        <span className="font-medium text-foreground">{maskedEmail}</span>.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Check your spam/junk folder if the email does not appear in your inbox.
      </p>

      <div className="mt-6">
        <Button
          type="button"
          onClick={() => void msc_onResend()}
          disabled={loading || cooldownSeconds > 0}
          className="bg-primary text-primary-foreground"
        >
          {loading
            ? 'Sending...'
            : cooldownSeconds > 0
              ? `Resend available in ${cooldownSeconds}s`
              : 'Resend Verification Email'}
        </Button>
      </div>
      {canUseDevBypass && (
        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void msc_onEnableDevBypass()}
            disabled={bypassLoading}
            className="border border-border"
          >
            {bypassLoading ? 'Enabling Dev Bypass...' : 'Enable Local Dev Trust Bypass (Admin)'}
          </Button>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${messageType === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {message}
        </p>
      )}
    </section>
  )
}
