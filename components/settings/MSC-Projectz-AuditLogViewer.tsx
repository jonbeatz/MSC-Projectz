'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, ShieldAlert } from 'lucide-react'

import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { msc_getAuditLogs, type MscAuditLogDoc } from '@/lib/msc_vault_audit_fetch'

const MSC_AUDIT_ACTIONS = ['ALL', 'USER_CREATE', 'USER_DELETE', 'USER_ROLE_UPDATE', 'PASSWORD_RESET'] as const

export function MSC_Projectz_AuditLogViewer() {
  const [logs, setLogs] = useState<MscAuditLogDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [action, setAction] = useState<(typeof MSC_AUDIT_ACTIONS)[number]>('ALL')
  const [actorId, setActorId] = useState('')
  const [selectedLog, setSelectedLog] = useState<MscAuditLogDoc | null>(null)

  const msc_loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await msc_getAuditLogs(page, {
        action: action === 'ALL' ? undefined : action,
        actorId: actorId.trim() || undefined,
      })
      setLogs(result.logs)
      setTotalPages(Math.max(1, result.totalPages))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load audit logs.')
      setLogs([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void msc_loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action])

  const detailsText = useMemo(() => {
    if (!selectedLog?.details) return '{}'
    try {
      return JSON.stringify(selectedLog.details, null, 2)
    } catch {
      return '{}'
    }
  }, [selectedLog])

  return (
    <RoleGate allowedRoles={['admin']}>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Audit Logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review sensitive admin actions including user role updates, password resets, and account deletions.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Action</Label>
              <Select
                value={action}
                onValueChange={(v) => {
                  setAction(v as (typeof MSC_AUDIT_ACTIONS)[number])
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MSC_AUDIT_ACTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === 'ALL' ? 'All actions' : item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Actor ID</Label>
              <Input
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                className="bg-input"
                placeholder="Filter by actor relationship ID"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPage(1)
                  void msc_loadLogs()
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit logs matched your filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                    <th className="px-3 py-2 text-left font-medium">Actor</th>
                    <th className="px-3 py-2 text-left font-medium">Action</th>
                    <th className="px-3 py-2 text-left font-medium">Target</th>
                    <th className="px-3 py-2 text-right font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={String(log.id)} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {log.actor?.email || log.actor?.username || String(log.actor?.id || '—')}
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">{log.action}</td>
                      <td className="px-3 py-2">
                        {log.target?.email || log.target?.username || String(log.target?.id || '—')}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.action || 'Event'} · {selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '—'}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[55vh] overflow-auto rounded-lg border border-border bg-secondary/50 p-3 text-xs text-foreground">
{detailsText}
          </pre>
        </DialogContent>
      </Dialog>
    </RoleGate>
  )
}
