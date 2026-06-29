'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, Save, Upload, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { msc_updateCurrentUserProfile, msc_uploadProfileAvatar } from '@/lib/msc_profile_server_actions'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function MSC_Projectz_ProfileRouteView() {
  const { appSettings, changeMasterPassword, user, updateUser } = useAppStore()
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || appSettings.email)
  const [avatar, setAvatar] = useState(user?.avatarUrl || user?.avatar || '')
  const [avatarId, setAvatarId] = useState<string | number | null>(user?.avatarId ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUsername(user?.username || '')
    setEmail(user?.email || appSettings.email)
    setAvatar(user?.avatarUrl || user?.avatar || '')
    setAvatarId(user?.avatarId ?? null)
  }, [appSettings.email, user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaveError(null)
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const uploaded = await msc_uploadProfileAvatar(formData)
      setAvatarId(uploaded.id)
      setAvatar(uploaded.url)
    } catch (error) {
      console.error('[MSC] upload profile avatar', error)
      setSaveError('Avatar upload failed. Please try again.')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const handleSaveProfile = async () => {
    setSaveError(null)
    setProfileSaving(true)
    const payload = {
      username,
      email,
      avatar: avatarId,
    }
    try {
      const updatedUser = await msc_updateCurrentUserProfile(payload)
      updateUser(updatedUser)
      setAvatar(updatedUser.avatarUrl || updatedUser.avatar || '')
      setAvatarId(updatedUser.avatarId ?? null)
      setSaveMessage('Profile saved successfully')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('[MSC] save profile', error)
      setSaveError('Profile save failed. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    const success = changeMasterPassword(currentPassword, newPassword)
    if (success) {
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setPasswordMessage({ type: 'error', text: 'Current password is incorrect' })
    }
    setTimeout(() => setPasswordMessage(null), 3000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal workspace settings for your account and security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="h-4 w-4" />
              {saveMessage}
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </span>
          )}
          <Button
            onClick={handleSaveProfile}
            disabled={avatarUploading || profileSaving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile information and avatar.</p>
        </div>
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {avatarUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>

          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-username" className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input text-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your password and account access.</p>
        </div>
        <div className="max-w-md space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Change Master Password</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-xs text-muted-foreground">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-input pr-10 text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-xs text-muted-foreground">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-input pr-10 text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-input text-foreground"
            />
          </div>

          {passwordMessage && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                passwordMessage.type === 'success' ? 'text-primary' : 'text-destructive',
              )}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {passwordMessage.text}
            </div>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Update Password
          </Button>
        </div>
      </section>
    </div>
  )
}
