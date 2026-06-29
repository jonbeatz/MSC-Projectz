'use client'

import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Mail } from 'lucide-react'

import { Msc_VerificationView } from '@/components/auth/msc_VerificationView'
import { MSC_Projectz_VerifyReminderClient } from '@/app/(main)/auth/verify-reminder/MSC-Projectz-VerifyReminderClient'
import { msc_buildVerificationEmailParts } from '@/lib/msc_verification_email_template'
import { cn } from '@/lib/utils'

type MscPreviewTab =
  'template' | 'invite-email' | 'success' | 'error' | 'expired' | 'verify-reminder-page' | 'verify-email-page'

const msc_floatPanel =
  'rounded-2xl border border-border/60 bg-card/70 shadow-[0_18px_48px_-16px_rgba(0,0,0,0.42)] backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-950/50 dark:shadow-black/55'

const msc_tabs: Array<{ id: MscPreviewTab; label: string }> = [
  { id: 'template', label: 'Verification email' },
  { id: 'invite-email', label: 'Invite email' },
  { id: 'success', label: 'Success' },
  { id: 'error', label: 'Error' },
  { id: 'expired', label: 'Expired' },
  { id: 'verify-reminder-page', label: 'Verify Reminder Page' },
  { id: 'verify-email-page', label: 'Verify Email Page' },
]

function msc_tabLabel(id: MscPreviewTab): string {
  return msc_tabs.find((t) => t.id === id)?.label ?? 'Preview'
}

export function Msc_EmailPreviewsClient() {
  const [activeTab, setActiveTab] = useState<MscPreviewTab>('template')
  const [origin, setOrigin] = useState('http://127.0.0.1:3000')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setOrigin(window.location.origin)
    }
  }, [])

  const emailPreview = useMemo(() => {
    if (activeTab !== 'template' && activeTab !== 'invite-email') return null
    const o = origin.replace(/\/$/, '')
    const verifyUrl = `${o}/auth/verify?token=preview-only-not-valid`
    const base = {
      recipientName: 'Jordan',
      recipientEmail: 'jordan@example.com',
      verifyUrl,
      signInOrigin: o,
    }
    if (activeTab === 'invite-email') {
      return msc_buildVerificationEmailParts({
        ...base,
        mode: 'invite',
        inviteTemporaryPassword: 'Preview-Temp9!Aa',
      })
    }
    return msc_buildVerificationEmailParts({
      ...base,
      mode: 'signup',
    })
  }, [origin, activeTab])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-msc-ui-accent/25 bg-msc-ui-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-msc-ui-accent">
            <FlaskConical className="h-3 w-3" aria-hidden />
            Local dev
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin only</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dev Playground</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Outbound verification and invitation emails use the same HTML as the <strong>Verification email</strong> and{' '}
          <strong>Invite email</strong> previews below (multipart: HTML + plain text). Nothing on this page sends mail —
          other tabs preview in-app UI states.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(11rem,13.5rem)_1fr] lg:items-start">
        <aside className={cn(msc_floatPanel, 'h-fit p-4 lg:sticky lg:top-24')}>
          <div className="mb-3 flex items-center gap-2 border-b border-border/50 pb-3 dark:border-white/10">
            <Mail className="h-4 w-4 text-msc-ui-accent" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scenarios</p>
          </div>
          <div className="mb-2">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
              Previews
            </p>
            <div className="space-y-1">
              {msc_tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-msc-ui-accent/30 bg-msc-ui-accent/15 font-medium text-msc-ui-accent shadow-sm'
                      : 'text-muted-foreground hover:border-border/40 hover:bg-muted/25 hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className={cn(msc_floatPanel, 'min-w-0 overflow-hidden')}>
          <div className="border-b border-border/60 px-4 py-3 dark:border-white/10 sm:px-5">
            <p className="text-xs font-medium text-muted-foreground">Live preview</p>
            <p className="text-sm font-semibold text-foreground">{msc_tabLabel(activeTab)}</p>
          </div>
          <div className="max-h-[min(70vh,720px)] overflow-y-auto p-3 sm:p-4">
            <div className="min-h-[480px] rounded-xl border border-border/50 bg-background/50 px-2 py-6 dark:border-white/[0.06] dark:bg-black/25 sm:px-4 sm:py-8">
              {emailPreview ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Subject:</span> {emailPreview.subject}
                  </p>
                  <iframe
                    title="Email HTML preview"
                    srcDoc={emailPreview.html}
                    className="h-[560px] w-full rounded-lg border border-border bg-[#0a0a0a]"
                    sandbox="allow-same-origin"
                  />
                  <details className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Plain-text part (same as mail clients without HTML)
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-muted-foreground">
                      {emailPreview.text}
                    </pre>
                  </details>
                </div>
              ) : activeTab === 'success' ? (
                <Msc_VerificationView forceState="success" embedded />
              ) : activeTab === 'error' ? (
                <Msc_VerificationView forceState="error" embedded />
              ) : activeTab === 'expired' ? (
                <Msc_VerificationView forceState="expired" embedded />
              ) : activeTab === 'verify-reminder-page' ? (
                <div className="mx-auto max-w-xl">
                  <MSC_Projectz_VerifyReminderClient maskedEmail="j***@gmail.com" canUseDevBypass={true} />
                </div>
              ) : (
                <Msc_VerificationView forceState="success" embedded />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
