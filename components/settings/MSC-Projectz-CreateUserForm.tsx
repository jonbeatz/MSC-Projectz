'use client'

import { useState } from 'react'
import { Mail, Plus, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { msc_createPayloadUserAsAdmin, msc_invitePayloadUserAsMaster } from '@/lib/msc_vault_user_admin'
import {
  msc_isNewPasswordCompliant,
  msc_newPasswordPolicyHint,
  msc_validateNewPassword,
} from '@/lib/msc_password_policy'
import type { MscCreateUserAdminInput, MscUserAdminRole } from '@/types/user-admin'

type MSC_Projectz_CreateUserFormProps = {
  onCreated: () => void
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void
}

export function MSC_Projectz_CreateUserForm({ onCreated, onMessage }: MSC_Projectz_CreateUserFormProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<MscUserAdminRole>('user')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'invite' | 'password'>('invite')

  const msc_handleInvite = async () => {
    if (!email.trim()) {
      onMessage({ type: 'error', text: 'Email is required.' })
      return
    }
    setSubmitting(true)
    const result = await msc_invitePayloadUserAsMaster({
      email: email.trim(),
      username: username.trim() || undefined,
      role,
    })
    setSubmitting(false)
    if (result.ok) {
      setEmail('')
      setUsername('')
      setPassword('')
      setRole('user')
      onMessage({
        type: 'success',
        text: 'Invite sent. They will receive an email with a verify link and a temporary sign-in password.',
      })
      onCreated()
      return
    }
    onMessage({ type: 'error', text: result.error })
  }

  const msc_handleCreateWithPassword = async () => {
    const input: MscCreateUserAdminInput = {
      email,
      username,
      password,
      role,
    }
    setSubmitting(true)
    const result = await msc_createPayloadUserAsAdmin(input)
    setSubmitting(false)
    if (result.ok) {
      setEmail('')
      setUsername('')
      setPassword('')
      setRole('user')
      onMessage({
        type: 'success',
        text: 'Server user created. They can sign in immediately with this password (email verification skipped).',
      })
      onCreated()
      return
    }
    onMessage({ type: 'error', text: result.error })
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 p-4 shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Invite or create server user</h3>
          <p className="text-xs text-muted-foreground">
            <strong>Invite</strong> emails a verify link + temporary password. <strong>Advanced</strong> sets a password
            now (no verification email).
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'invite' | 'password')} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="invite">Invite by email</TabsTrigger>
          <TabsTrigger value="password">Advanced (password)</TabsTrigger>
        </TabsList>

        <TabsContent value="invite" className="mt-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-invite-email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="settings-invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="bg-input pl-10"
                  placeholder="teammate@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-invite-username" className="text-xs text-muted-foreground">
                Username
              </Label>
              <Input
                id="settings-invite-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="bg-input"
                placeholder="Optional display name"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as MscUserAdminRole)}>
                <SelectTrigger className="w-full max-w-md bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="master-admin">Master Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs text-muted-foreground">
              They verify their email from the link, then sign in at this site&apos;s login with the temporary password
              in the same email. Change password in Profile after first login.
            </p>
            <Button
              type="button"
              onClick={() => void msc_handleInvite()}
              disabled={submitting || !email.trim()}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Sending…' : 'Send invite'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="password" className="mt-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-user-email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="settings-user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="bg-input pl-10"
                  placeholder="teammate@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-user-username" className="text-xs text-muted-foreground">
                Username
              </Label>
              <Input
                id="settings-user-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="bg-input"
                placeholder="Optional display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-user-password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <Input
                id="settings-user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-input"
                placeholder="Uppercase, number, special, 8+ chars"
              />
              <p className="text-xs text-muted-foreground">{msc_newPasswordPolicyHint()}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as MscUserAdminRole)}>
                <SelectTrigger className="w-full bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="master-admin">Master Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              User is created immediately with this password. No verification email is sent — use for trusted setups
              only.
            </p>
            <Button
              type="button"
              onClick={() => {
                const mscPw = msc_validateNewPassword(password)
                if (!mscPw.ok) {
                  onMessage({ type: 'error', text: mscPw.message })
                  return
                }
                void msc_handleCreateWithPassword()
              }}
              disabled={submitting || !email.trim() || !msc_isNewPasswordCompliant(password)}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-4 text-xs text-muted-foreground">
        Users see their own vault projects. Admins can manage server users and project records. Master Admin can assign
        or remove Master Admin access.
      </p>
    </div>
  )
}
