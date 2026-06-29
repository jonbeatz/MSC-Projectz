'use client'

import { useState } from 'react'
import { Apple, CheckCircle, DatabaseBackup, Mail, Monitor, Save, Server } from 'lucide-react'

import { MSC_Projectz_PayloadUsersPanel } from '@/components/MSC-Projectz-PayloadUsersPanel'
import { MSC_Projectz_AuditLogViewer } from '@/components/settings/MSC-Projectz-AuditLogViewer'
import { RoleGate } from '@/components/shared/RoleGate'
import { MSC_Projectz_SettingsUsersSection } from '@/components/settings/MSC-Projectz-SettingsUsersSection'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { msc_backupDatabase } from '@/lib/msc_server_actions'
import { msc_updateSystemConfig } from '@/lib/msc_vault_server_actions'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

const MSC_PROJECTZ_USE_UNIFIED_SETTINGS_USERS = true

/** Frosted float on Command Center canvas — avoids stacked solid “dark bands” between sections. */
const msc_floatSection =
  'overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-[0_18px_48px_-16px_rgba(0,0,0,0.42)] backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-950/50 dark:shadow-black/55'

const msc_insetPanel =
  'rounded-xl border border-border/50 bg-muted/15 p-4 shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.35)]'

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
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Studio server configuration and user administration.</p>
      </div>

      <div className="space-y-6">
        <section className={cn(msc_floatSection, 'p-6')}>
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
                <span className="flex items-center gap-2 text-sm text-msc-ui-accent">
                  <CheckCircle className="h-4 w-4" />
                  {saveMessage}
                </span>
              )}
              <Button
                onClick={() => void handleSaveSettings()}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                Save System
              </Button>
            </div>
          </div>
        </section>

        {MSC_PROJECTZ_USE_UNIFIED_SETTINGS_USERS ? (
          <MSC_Projectz_SettingsUsersSection />
        ) : (
          <section id="users" className={msc_floatSection}>
            <div className="border-b border-border/60 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-lg font-semibold text-foreground">Users</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage Payload users, roles, and workspace invitations.
              </p>
            </div>
            <div className="space-y-6 p-6">
              <MSC_Projectz_PayloadUsersPanel />
            </div>
          </section>
        )}

        <section id="system" className={msc_floatSection}>
          <div className="border-b border-border/60 px-6 py-4 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-foreground">System</h2>
            <p className="mt-1 text-sm text-muted-foreground">Configure local path format, backups, and status.</p>
          </div>
          <div className="space-y-5 p-6">
            <div className={msc_insetPanel}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background/40 dark:border-white/[0.08] dark:bg-white/[0.05]">
                  <Mail className="h-4 w-4 text-msc-ui-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Mail (IMAP / SMTP)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Incoming and outgoing mail are managed per project. Open a project, choose{' '}
                    <span className="text-foreground">Edit Project</span>, and use the{' '}
                    <span className="text-foreground">SMTP</span> tab to configure IMAP and SMTP.
                  </p>
                </div>
              </div>
            </div>
            <div id="backup" className={msc_insetPanel}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-background/40 dark:border-white/[0.08] dark:bg-white/[0.05]">
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
                  <Switch
                    checked={pathFormat === 'mac'}
                    onCheckedChange={(checked) => setPathFormat(checked ? 'mac' : 'windows')}
                  />
                  <span className="text-xs text-primary">Mac</span>
                </div>
              </div>
            </div>

            <div className={msc_insetPanel}>
              <div className="flex items-center gap-2">
                <DatabaseBackup className="h-4 w-4 text-msc-ui-accent" />
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

            <div className={msc_insetPanel}>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-msc-ui-accent" />
                <p className="text-sm font-medium text-foreground">Telemetry & Logging</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Logging and telemetry hooks are ready for system-level instrumentation.
              </p>
            </div>
          </div>
        </section>

        <RoleGate allowedRoles={['admin']}>
          <section className={cn(msc_floatSection, 'mt-2')}>
            <div className="border-b border-border/60 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-xl font-semibold text-foreground">System Audit Logs</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Review administrative actions, role changes, and sensitive account operations from the settings
                dashboard.
              </p>
            </div>
            <MSC_Projectz_AuditLogViewer hideTitle />
          </section>
        </RoleGate>
      </div>
    </div>
  )
}
