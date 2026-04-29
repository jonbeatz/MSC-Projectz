'use client'

import { useState } from 'react'
import { FlaskConical, Mail } from 'lucide-react'

import { Msc_VerificationView } from '@/components/auth/msc_VerificationView'
import { MSC_Projectz_VerifyReminderClient } from '@/app/(main)/auth/verify-reminder/MSC-Projectz-VerifyReminderClient'
import { cn } from '@/lib/utils'

type MscPreviewTab =
  | 'template'
  | 'success'
  | 'error'
  | 'expired'
  | 'verify-reminder-page'
  | 'verify-email-page'

const msc_floatPanel =
  'rounded-2xl border border-border/60 bg-card/70 shadow-[0_18px_48px_-16px_rgba(0,0,0,0.42)] backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-950/50 dark:shadow-black/55'

const msc_sections: Array<{ heading: string; tabs: Array<{ id: MscPreviewTab; label: string }> }> = [
  {
    heading: 'Previews',
    tabs: [
      { id: 'template', label: 'Email Template' },
      { id: 'success', label: 'Success' },
      { id: 'error', label: 'Error' },
      { id: 'expired', label: 'Expired' },
      { id: 'verify-reminder-page', label: 'Verify Reminder Page' },
      { id: 'verify-email-page', label: 'Verify Email Page' },
    ],
  },
]

export function Msc_EmailPreviewsClient() {
  const [activeTab, setActiveTab] = useState<MscPreviewTab>('template')

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-msc-ui-accent/25 bg-msc-ui-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-msc-ui-accent">
            <FlaskConical className="h-3 w-3" aria-hidden />
            Local dev
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Admin only
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dev Playground</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Deterministic previews for verification email flows. Nothing here sends real mail — use these states to tune
          copy and layout before shipping.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(11rem,13.5rem)_1fr] lg:items-start">
        <aside className={cn(msc_floatPanel, 'h-fit p-4 lg:sticky lg:top-24')}>
          <div className="mb-3 flex items-center gap-2 border-b border-border/50 pb-3 dark:border-white/10">
            <Mail className="h-4 w-4 text-msc-ui-accent" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scenarios</p>
          </div>
          {msc_sections.map((section) => (
            <div key={section.heading} className="mb-2">
              {section.heading ? (
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
                  {section.heading}
                </p>
              ) : null}
              <div className="space-y-1">
                {section.tabs.map((tab) => (
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
          ))}
        </aside>

        <section className={cn(msc_floatPanel, 'min-w-0 overflow-hidden')}>
          <div className="border-b border-border/60 px-4 py-3 dark:border-white/10 sm:px-5">
            <p className="text-xs font-medium text-muted-foreground">Live preview</p>
            <p className="text-sm font-semibold text-foreground">
              {msc_sections[0].tabs.find((t) => t.id === activeTab)?.label ?? 'Preview'}
            </p>
          </div>
          <div className="max-h-[min(70vh,640px)] overflow-y-auto p-3 sm:p-4">
            <div className="min-h-[480px] rounded-xl border border-border/50 bg-background/50 px-3 py-10 dark:border-white/[0.06] dark:bg-black/25 sm:px-6 sm:py-12">
              {activeTab === 'template' ? (
                <div className="mx-auto flex min-h-[420px] w-full max-w-lg items-center justify-center">
                  <section className="w-full rounded-xl border border-border/60 bg-card/80 p-6 text-center shadow-md dark:border-white/[0.08] dark:bg-zinc-900/60">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      MSC-Projectz
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-foreground">Verification Email Template</h2>
                    <div className="mt-5 space-y-1 text-left text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Subject:</span> Verify your MSC-Projectz account
                      </p>
                      <p className="pt-1">
                        <span className="font-medium text-foreground">Body preview:</span>
                      </p>
                      <p>Hello NAME,</p>
                      <p>Please verify your email address to activate your account.</p>
                      <p>{'{verification_link}'}</p>
                      <p>This link expires in 24 hours.</p>
                    </div>
                  </section>
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
