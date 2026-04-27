'use client'

import { useState } from 'react'
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RoleGate } from '@/components/shared/RoleGate'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  msc_deletePayloadUserAsAdmin,
  msc_resetPayloadUserPasswordAsAdmin,
  msc_updatePayloadUserRoleAsAdmin,
} from '@/lib/msc_vault_user_admin'
import { msc_isNewPasswordCompliant } from '@/lib/msc_password_policy'
import type { MscUserAdminRole, MscUserAdminRow } from '@/types/user-admin'

type MSC_Projectz_UserAdminActionsProps = {
  user: MscUserAdminRow
  onChanged: () => void
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void
}

export function MSC_Projectz_UserAdminActions({
  user,
  onChanged,
  onMessage,
}: MSC_Projectz_UserAdminActionsProps) {
  const [role, setRole] = useState<MscUserAdminRole>(user.role)
  const [password, setPassword] = useState('')
  const [busyAction, setBusyAction] = useState<'role' | 'password' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const msc_handleRoleUpdate = async () => {
    setBusyAction('role')
    const result = await msc_updatePayloadUserRoleAsAdmin({ id: user.id, role })
    setBusyAction(null)

    if (result.ok) {
      onMessage({ type: 'success', text: `Updated ${user.email} role.` })
      onChanged()
      return
    }

    onMessage({ type: 'error', text: result.error })
  }

  const msc_handlePasswordReset = async () => {
    setBusyAction('password')
    const result = await msc_resetPayloadUserPasswordAsAdmin({ id: user.id, password })
    setBusyAction(null)

    if (result.ok) {
      setPassword('')
      onMessage({ type: 'success', text: `Reset password for ${user.email}.` })
      onChanged()
      return
    }

    onMessage({ type: 'error', text: result.error })
  }

  const msc_handleDelete = async () => {
    setBusyAction('delete')
    const result = await msc_deletePayloadUserAsAdmin(user.id)
    setBusyAction(null)

    if (result.ok) {
      onMessage({ type: 'success', text: `Deleted ${user.email}.` })
      onChanged()
      return
    }

    setConfirmDelete(false)
    onMessage({ type: 'error', text: result.error })
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-secondary/30 p-3 md:grid-cols-[minmax(150px,0.7fr)_1fr_auto]">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Role</Label>
        <div className="flex gap-2">
          <Select value={role} onValueChange={(value) => setRole(value as MscUserAdminRole)}>
            <SelectTrigger className="w-full bg-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void msc_handleRoleUpdate()}
            disabled={busyAction === 'role' || role === user.role}
          >
            <ShieldCheck className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Reset password</Label>
        <div className="flex gap-2">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="bg-input"
            placeholder="New password"
          />
          <RoleGate allowedRoles={['admin']}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void msc_handlePasswordReset()}
              disabled={busyAction === 'password' || !msc_isNewPasswordCompliant(password)}
            >
              <KeyRound className="h-4 w-4" />
              Reset
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className="flex items-end justify-end gap-2">
        <RoleGate allowedRoles={['admin']}>
          {confirmDelete ? (
            <>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void msc_handleDelete()}
                disabled={busyAction === 'delete'}
              >
                Confirm
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={user.isCurrentUser}
              title={user.isCurrentUser ? 'You cannot delete your own account' : 'Delete server user'}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </RoleGate>
      </div>
    </div>
  )
}
