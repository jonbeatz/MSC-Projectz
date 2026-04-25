'use client'

import { useState } from 'react'
import { AlertCircle, Apple, CheckCircle, DatabaseBackup, Eye, EyeOff, Monitor, Save, Send, Server, Shield, Users } from 'lucide-react'

import { MSC_Projectz_PayloadUsersPanel } from '@/components/MSC-Projectz-PayloadUsersPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { UserManagementModal } from '@/components/user-management-modal'
import { toast } from '@/hooks/use-toast'
import { msc_backupDatabase } from '@/lib/msc_server_actions'
import { msc_testSystemEmailConfig, msc_updateSystemConfig } from '@/lib/msc_vault_server_actions'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function MSC_Projectz_AdminSettingsRouteView() {
  const { appSettings, updateAppSettings } = useAppStore()
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [pathFormat, setPathFormat] = useState(appSettings.pathFormat)
  const [smtpIncomingHost, setSmtpIncomingHost] = useState(appSettings.smtp.incomingHost)
  const [smtpIncomingPort, setSmtpIncomingPort] = useState(appSettings.smtp.incomingPort)
  const [smtpOutgoingHost, setSmtpOutgoingHost] = useState(appSettings.smtp.outgoingHost)
  const [smtpOutgoingPort, setSmtpOutgoingPort] = useState(appSettings.smtp.outgoingPort)
  const [smtpUsername, setSmtpUsername] = useState(appSettings.smtp.username)
  const [smtpPassword, setSmtpPassword] = useState(appSettings.smtp.password)
  const [smtpSsl, setSmtpSsl] = useState(appSettings.smtp.ssl)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailMessage, setTestEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const msc_systemConfig = () => ({
    pathFormat,
    smtp: {
      incomingHost: smtpIncomingHost,
      incomingPort: smtpIncomingPort,
      outgoingHost: smtpOutgoingHost,
      outgoingPort: smtpOutgoingPort,
      username: smtpUsername,
      password: smtpPassword,
      ssl: smtpSsl,
    },
  })

  const handleSaveSettings = async () => {
    const config = await msc_updateSystemConfig(msc_systemConfig())
    updateAppSettings({
      pathFormat: config.pathFormat,
      smtp: config.smtp,
    })
    setSaveMessage('System settings saved')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleSendTestEmail = async () => {
    setTestEmailSending(true)
    setTestEmailMessage(null)
    const result = await msc_testSystemEmailConfig(msc_systemConfig())
    setTestEmailMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setTestEmailSending(false)
    setTimeout(() => setTestEmailMessage(null), 3000)
  }

  const handleBackupDatabase = async () => {
    setBackupBusy(true)
    try {
      const result = await msc_backupDatabase()
      toast({
        title: 'Backup created successfully',
        description: result.fileName,
      })
    } catch (e) {
      toast({
        title: 'Backup failed',
        description: e instanceof Error ? e.message : 'Unable to create database backup.',
        variant: 'destructive',
      })
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">System Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Global user management, SMTP, telemetry, and advanced configuration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="h-4 w-4" />
              {saveMessage}
            </span>
          )}
          <Button onClick={() => void handleSaveSettings()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save System
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage Payload users, roles, and workspace invitations.</p>
        </div>
        <div className="space-y-6 p-6">
          <MSC_Projectz_PayloadUsersPanel />
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Workspace invites (in-app list)</p>
            <Button
              onClick={() => setUserManagementOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="h-4 w-4" />
              Open invite / pending users
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">System</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configure global paths, SMTP delivery, SSL, and telemetry.</p>
        </div>
        <div className="space-y-6 p-6">
          <div className="rounded-lg border border-border bg-secondary p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card">
                  {pathFormat === 'windows' ? (
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Apple className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Local Path Format</p>
                  <p className="text-xs text-muted-foreground">
                    {pathFormat === 'windows'
                      ? 'Windows style: C:\\Projects\\my-project'
                      : 'Mac style: /Users/name/Projects/my-project'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Windows</span>
                <Switch checked={pathFormat === 'mac'} onCheckedChange={(checked) => setPathFormat(checked ? 'mac' : 'windows')} />
                <span className="text-xs text-primary">Mac</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-secondary p-4">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Incoming Mail (IMAP)</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-imap-host" className="text-xs text-muted-foreground">Host</Label>
                  <Input id="admin-imap-host" value={smtpIncomingHost} onChange={(e) => setSmtpIncomingHost(e.target.value)} className="bg-card text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-imap-port" className="text-xs text-muted-foreground">Port</Label>
                  <Input id="admin-imap-port" value={smtpIncomingPort} onChange={(e) => setSmtpIncomingPort(e.target.value)} className="bg-card text-foreground" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary p-4">
              <div className="mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Outgoing Mail (SMTP)</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-smtp-host" className="text-xs text-muted-foreground">Host</Label>
                  <Input id="admin-smtp-host" value={smtpOutgoingHost} onChange={(e) => setSmtpOutgoingHost(e.target.value)} className="bg-card text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-smtp-port" className="text-xs text-muted-foreground">Port</Label>
                  <Input id="admin-smtp-port" value={smtpOutgoingPort} onChange={(e) => setSmtpOutgoingPort(e.target.value)} className="bg-card text-foreground" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-smtp-username" className="text-xs text-muted-foreground">SMTP Username</Label>
              <Input id="admin-smtp-username" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} className="bg-input text-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-smtp-password" className="text-xs text-muted-foreground">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="admin-smtp-password"
                  type={showSmtpPassword ? 'text' : 'password'}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="bg-input pr-10 text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary p-4">
            <div>
              <p className="text-sm font-medium text-foreground">SSL/TLS Encryption</p>
              <p className="text-xs text-muted-foreground">Required for secure email transmission.</p>
            </div>
            <Switch checked={smtpSsl} onCheckedChange={setSmtpSsl} />
          </div>

          <div className="rounded-lg border border-border bg-secondary p-4">
            <div className="flex items-center gap-2">
              <DatabaseBackup className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Database Backup</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Creates a timestamped SQLite copy in the local `/backups` directory.
            </p>
            <Button
              variant="outline"
              onClick={() => void handleBackupDatabase()}
              disabled={backupBusy}
              className="mt-4 gap-2"
            >
              <DatabaseBackup className="h-4 w-4" />
              {backupBusy ? 'Backing up...' : 'Backup Database'}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-secondary p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Telemetry & Logging</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Logging and telemetry hooks are ready for system-level instrumentation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" onClick={handleSendTestEmail} disabled={testEmailSending} className="gap-2">
              <Send className="h-4 w-4" />
              {testEmailSending ? 'Sending...' : 'Send Test Email'}
            </Button>
            {testEmailMessage && (
              <div
                className={cn(
                  'flex items-center gap-2 text-sm',
                  testEmailMessage.type === 'success' ? 'text-primary' : 'text-destructive',
                )}
              >
                {testEmailMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {testEmailMessage.text}
              </div>
            )}
          </div>
        </div>
      </section>

      <UserManagementModal isOpen={userManagementOpen} onClose={() => setUserManagementOpen(false)} />
    </div>
  )
}
