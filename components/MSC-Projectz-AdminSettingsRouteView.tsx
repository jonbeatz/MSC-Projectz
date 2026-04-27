'use client'

import { useState } from 'react'
import { Apple, CheckCircle, DatabaseBackup, Mail, Monitor, Save, Server } from 'lucide-react'
import Link from 'next/link'

import { MSC_Projectz_PayloadUsersPanel } from '@/components/MSC-Projectz-PayloadUsersPanel'
import { RoleGate } from '@/components/shared/RoleGate'
import { MSC_Projectz_SettingsUsersSection } from '@/components/settings/MSC-Projectz-SettingsUsersSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { msc_backupDatabase } from '@/lib/msc_server_actions'
import { msc_updateSystemConfig } from '@/lib/msc_vault_server_actions'
import { useAppStore } from '@/lib/store'

const MSC_PROJECTZ_USE_UNIFIED_SETTINGS_USERS = true

export function MSC_Projectz_AdminSettingsRouteView() {
  const { appSettings, updateAppSettings } = useAppStore()
  const [pathFormat, setPathFormat] = useState(appSettings.pathFormat)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)

  const msc_systemConfig = () => ({
    pathFormat,
    smtp: appSettings.smtp,
  })

  const handleSaveSettings = async () => {
    const config = await msc_updateSystemConfig(msc_systemConfig())
    updateAppSettings({
      pathFormat: config.pathFormat,
    })
    void config.smtp
    setSaveMessage('System settings saved')
    setTimeout(() => setSaveMessage(null), 3000)
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
      })
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 bg-background">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>

      <div className="space-y-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Control Center
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">System Admin</h2>
                <p className="mt-2 text-sm text-muted-foreground">
            Global user management, system paths, telemetry, and database tools.
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
          </div>

      {MSC_PROJECTZ_USE_UNIFIED_SETTINGS_USERS ? (
        <MSC_Projectz_SettingsUsersSection />
      ) : (
        <section id="users" className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Users</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage Payload users, roles, and workspace invitations.</p>
          </div>
          <div className="space-y-6 p-6">
            <MSC_Projectz_PayloadUsersPanel />
          </div>
        </section>
      )}

      <RoleGate allowedRoles={['admin']}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Audit Logs</CardTitle>
            <CardDescription>
              View the history of administrative actions, role changes, and system access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings/audit">View Audit History</Link>
            </Button>
          </CardContent>
        </Card>
      </RoleGate>

      <section id="system" className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">System</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configure local path format, backups, and status.</p>
        </div>
        <div className="space-y-6 p-6">
          <div className="rounded-lg border border-border bg-secondary/80 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-card">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Mail (IMAP / SMTP)</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Incoming and outgoing mail are managed per project. Open a project, choose <span className="text-foreground">Edit Project</span>, and use the <span className="text-foreground">SMTP</span> tab to configure IMAP and SMTP.
                </p>
              </div>
            </div>
          </div>
          <div id="backup" className="rounded-lg border border-border bg-secondary p-4">
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
                      ? 'Use Windows project root paths while working locally.'
                      : 'Use POSIX project root paths while working on Linux/macOS.'}
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

        </div>
      </section>

      </div>

    </div>
  )
}
