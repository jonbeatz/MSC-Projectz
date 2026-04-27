'use client'

import { useState } from 'react'
import { Msc_VerificationView } from '@/components/auth/msc_VerificationView'
import { MSC_Projectz_VerifyReminderClient } from '@/app/auth/verify-reminder/MSC-Projectz-VerifyReminderClient'

type MscPreviewTab =
  | 'template'
  | 'success'
  | 'error'
  | 'expired'
  | 'verify-reminder-page'
  | 'verify-email-page'

const msc_sections: Array<{ heading: string; tabs: Array<{ id: MscPreviewTab; label: string }> }> = [
  {
    heading: '',
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
    <div className="flex min-h-[70vh] gap-4 bg-[#121212] p-3">
      <aside className="w-56 shrink-0 rounded-xl border border-border bg-card p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Dev Playground
        </p>
        {msc_sections.map((section) => (
          <div key={section.heading} className="mb-4">
            <div className="space-y-1">
              {section.tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-secondary text-white'
                      : 'text-muted-foreground hover:bg-secondary hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <section className="min-w-0 flex-1 rounded-xl border border-border bg-card p-3">
        <div className="h-[560px] overflow-y-auto rounded-lg border border-border bg-background px-4 py-[100px] text-sm text-[#E0E0E0]">
        {activeTab === 'template' ? (
          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">Verification Email Template</h2>
            <p className="mb-2">Subject: Verify your MSC-Projectz account</p>
            <p>
              Body preview:
              <br />
              Hello NAME,
              <br />
              Please verify your email address to activate your account.
              <br />
              {'{verification_link}'}
              <br />
              This link expires in 24 hours.
            </p>
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
          <Msc_VerificationView forceState="loading" embedded />
        )}
        </div>
      </section>
    </div>
  )
}
