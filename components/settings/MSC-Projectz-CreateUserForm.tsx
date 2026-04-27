'use client'

import { useState } from 'react'
import { Mail, Plus, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { msc_createPayloadUserAsAdmin } from '@/lib/msc_vault_user_admin'
import { msc_isNewPasswordCompliant, msc_newPasswordPolicyHint } from '@/lib/msc_password_policy'
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

  const msc_handleCreate = async () => {
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
      onMessage({ type: 'success', text: 'Server user created.' })
      onCreated()
      return
    }

    onMessage({ type: 'error', text: result.error })
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Create server user</h3>
          <p className="text-xs text-muted-foreground">Creates a real Payload account for Command Center access.</p>
        </div>
      </div>

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
            Temporary password
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Users see their own vault projects. Admins can manage server users and project records.
          Master Admin can assign or remove Master Admin access.
        </p>
        <Button
          type="button"
          onClick={() => void msc_handleCreate()}
          disabled={submitting || !email.trim() || !msc_isNewPasswordCompliant(password)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          {submitting ? 'Creating...' : 'Create user'}
        </Button>
      </div>
    </div>
  )
}
