'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Lock, Mail, User } from 'lucide-react'

import { msc_registerUser } from '@/lib/msc_auth_actions'
import { msc_isNewPasswordCompliant, msc_newPasswordPolicyHint, msc_validateNewPassword } from '@/lib/msc_password_policy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MscRegisterStatus = { success: boolean; message: string } | null

export function MSC_Projectz_RegisterForm() {
  const [msc_email, setMscEmail] = useState('')
  const [msc_password, setMscPassword] = useState('')
  const [msc_name, setMscName] = useState('')
  const [msc_submitting, setMscSubmitting] = useState(false)
  const [msc_status, setMscStatus] = useState<MscRegisterStatus>(null)

  async function msc_onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMscSubmitting(true)
    setMscStatus(null)
    const mscPw = msc_validateNewPassword(msc_password)
    if (!mscPw.ok) {
      setMscStatus({ success: false, message: mscPw.message })
      setMscSubmitting(false)
      return
    }
    const result = await msc_registerUser(msc_email, msc_password, msc_name)
    setMscStatus(result)
    setMscSubmitting(false)
  }

  if (msc_status?.success) {
    return (
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-foreground">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Request Sent</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">{msc_status.message}</p>
        <Link href="/auth" className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-90">
          <ArrowLeft className="h-4 w-4" />
          Return to Login
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={msc_onSubmit}
      className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-foreground"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Request Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit your account request. An admin can then grant project access.
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Name</span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            value={msc_name}
            onChange={(e) => setMscName(e.target.value)}
            placeholder="Your name"
            className="pl-10"
          />
        </div>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Email</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            type="email"
            value={msc_email}
            onChange={(e) => setMscEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-10"
          />
        </div>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Password</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            type="password"
            value={msc_password}
            onChange={(e) => setMscPassword(e.target.value)}
            placeholder="Strong password"
            className="pl-10"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{msc_newPasswordPolicyHint()}</p>
      </label>

      {msc_status?.message && !msc_status.success ? (
        <p className="text-sm text-destructive" role="status">
          {msc_status.message}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={
          msc_submitting ||
          !msc_name.trim() ||
          !msc_email.trim() ||
          !msc_isNewPasswordCompliant(msc_password)
        }
      >
        {msc_submitting ? 'Submitting…' : 'Request Access'}
      </Button>

      <Link href="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Link>
    </form>
  )
}
