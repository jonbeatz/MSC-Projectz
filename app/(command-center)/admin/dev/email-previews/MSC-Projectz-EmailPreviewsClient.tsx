'use client'

import { useState } from 'react'
import { VerificationView } from '@/components/auth/VerificationView'

type PreviewTab = 'template' | 'success' | 'error' | 'expired'

const tabs: Array<{ id: PreviewTab; label: string }> = [
  { id: 'template', label: 'Email Template' },
  { id: 'success', label: 'Success State' },
  { id: 'error', label: 'Error State' },
  { id: 'expired', label: 'Expired State' },
]

export function MSC_Projectz_EmailPreviewsClient() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('template')

  return (
    <div className="flex min-h-[70vh] gap-4">
      <aside className="w-56 shrink-0 rounded-xl border border-border bg-card p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Identity Playground
        </p>
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 flex-1 rounded-xl border border-border bg-card p-3">
        {activeTab === 'template' ? (
          <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
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
          <VerificationView forceState="success" />
        ) : activeTab === 'error' ? (
          <VerificationView forceState="error" />
        ) : (
          <VerificationView forceState="expired" />
        )}
      </section>
    </div>
  )
}
