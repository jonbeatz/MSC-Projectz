'use client'

import { useCallback, useEffect, useState } from 'react'
import { Code2, Loader2, Plus } from 'lucide-react'

import {
  msc_createProjectSnippet,
  msc_getProjectSnippets,
  msc_publishProjectSnippet,
  msc_updateProjectSnippet,
  type MscVaultSnippetUi,
  type MscVaultSnippetProjectFlags,
} from '@/lib/msc_vault_snippet_actions'
import { msc_hasLegacyVaultSnippets, msc_migrateLegacySnippets } from '@/lib/msc_vault_migration'
import { useAppStore } from '@/lib/store'
import type { Project } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MSC_Projectz_SnippetDrawer,
  MSC_SNIPPET_LANGUAGES,
} from '@/components/MSC-Projectz-SnippetDrawer'
import { MSC_Projectz_SnippetViewer } from '@/components/MSC-Projectz-SnippetViewer'
import { msc_isQuietInfrastructureUiMessage, msc_publicPayloadError } from '@/lib/msc_public_error'
import { cn } from '@/lib/utils'

function msc_languageLabel(value: string): string {
  return MSC_SNIPPET_LANGUAGES.find((o) => o.value === value)?.label ?? value
}

function msc_statusBadgeVariant(s: MscVaultSnippetUi['status']): 'default' | 'secondary' | 'outline' {
  if (s === 'published') return 'default'
  if (s === 'archived') return 'outline'
  return 'secondary'
}

export function MSC_Projectz_TaskPulseCodeVault({
  project,
  onOpenClientVault,
}: {
  project: Project
  /** Opens CRM Client Drawer on the Vault tab (parent handles sheet state). */
  onOpenClientVault?: () => void
}) {
  const userId = useAppStore((s) => s.user?.payloadUserId)
  const [snippets, setSnippets] = useState<MscVaultSnippetUi[]>([])
  const [flags, setFlags] = useState<MscVaultSnippetProjectFlags>({
    canCreate: false,
    canPublish: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formLanguage, setFormLanguage] = useState('typescript')
  const [formCategory, setFormCategory] = useState('general')
  const [formVisibility, setFormVisibility] = useState<'personal' | 'project'>('personal')

  const [detailOpen, setDetailOpen] = useState(false)
  const [activeSnippet, setActiveSnippet] = useState<MscVaultSnippetUi | null>(null)
  const [publishBusy, setPublishBusy] = useState(false)
  const [detailSaveBusy, setDetailSaveBusy] = useState(false)

  const [legacyImportBanner, setLegacyImportBanner] = useState(false)
  const [importBusy, setImportBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await msc_getProjectSnippets(project.id)
    if (!res.ok) {
      setError(res.error)
      setSnippets([])
      setLoading(false)
      return
    }
    setSnippets(res.snippets)
    setFlags(res.flags)
    setLoading(false)
  }, [project.id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (userId === undefined || userId === null) {
      setLegacyImportBanner(false)
      return
    }
    if (loading) return
    setLegacyImportBanner(msc_hasLegacyVaultSnippets(userId) && flags.canCreate)
  }, [userId, loading, flags.canCreate])

  const openDetail = (s: MscVaultSnippetUi) => {
    setActiveSnippet(s)
    setDetailOpen(true)
  }

  const handleCreate = async () => {
    const title = formTitle.trim()
    const content = formContent.trim()
    if (!title || !content) return
    setSubmitting(true)
    const res = await msc_createProjectSnippet({
      projectId: project.id,
      title,
      content,
      language: formLanguage,
      category: formCategory,
      visibility: formVisibility,
      status: 'draft',
    })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setSheetOpen(false)
    setFormTitle('')
    setFormContent('')
    setFormLanguage('typescript')
    setFormCategory('general')
    setFormVisibility('personal')
    await load()
  }

  const handleLegacyImport = async () => {
    if (userId === undefined || userId === null) {
      setError('Sign in is required to import legacy snippets.')
      return
    }
    setImportBusy(true)
    setError(null)
    const res = await msc_migrateLegacySnippets({ userId, projectId: project.id })
    setImportBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setLegacyImportBanner(false)
    await load()
  }

  const handlePublish = async () => {
    if (!activeSnippet || !flags.canPublish) return
    setPublishBusy(true)
    const res = await msc_publishProjectSnippet(project.id, activeSnippet.id)
    setPublishBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDetailOpen(false)
    setActiveSnippet(null)
    await load()
  }

  const showPublishInDetail =
    Boolean(activeSnippet) &&
    activeSnippet!.status === 'draft' &&
    flags.canPublish

  return (
    <div className="msc-task-pulse-code-vault flex min-h-[320px] flex-col gap-3" data-msc-component="task-pulse-code-vault">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Snippets</h3>
          <p className="text-[11px] text-muted-foreground">Scoped to this vault project.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.clientId && onOpenClientVault ? (
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => onOpenClientVault()}>
              Open Client Vault
            </Button>
          ) : null}
          {flags.canCreate && (
            <Button type="button" size="sm" className="gap-1.5 bg-primary text-primary-foreground" onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4" />
              Add snippet
            </Button>
          )}
        </div>
      </div>

      {legacyImportBanner && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-secondary/30 px-3 py-2.5 text-sm text-foreground shadow-sm backdrop-blur-sm"
          role="status"
        >
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
            We&apos;ve upgraded Code Vault. Import your legacy snippets from this browser?
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 border border-border bg-card/80 text-foreground hover:bg-card"
            disabled={importBusy}
            onClick={() => void handleLegacyImport()}
          >
            {importBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
          </Button>
        </div>
      )}

      {error && !msc_isQuietInfrastructureUiMessage(error) ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
          {msc_publicPayloadError(error)}
        </p>
      ) : error && msc_isQuietInfrastructureUiMessage(error) ? (
        <p className="rounded-md border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
          Snippets couldn&apos;t load—try refreshing.
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-sm">Loading snippets…</span>
        </div>
      ) : snippets.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
            <Code2 className="h-7 w-7 text-muted-foreground opacity-80" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No snippets yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Capture reusable code and notes for this project. Drafts stay scoped until an owner publishes to the team library.
            </p>
          </div>
          {flags.canCreate && (
            <Button type="button" size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first snippet
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex max-h-[min(420px,55vh)] flex-col gap-2 overflow-y-auto pr-1">
          {snippets.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => openDetail(s)}
                className={cn(
                  'flex w-full flex-col gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors',
                  'hover:border-primary/30 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-msc-gold/40',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 font-medium text-foreground">{s.title}</span>
                  <Badge variant={msc_statusBadgeVariant(s.status)} className="shrink-0 text-[10px] capitalize">
                    {s.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {msc_languageLabel(s.language)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal capitalize">
                    {s.visibility}
                  </Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <MSC_Projectz_SnippetDrawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formContent={formContent}
        setFormContent={setFormContent}
        formLanguage={formLanguage}
        setFormLanguage={setFormLanguage}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formVisibility={formVisibility}
        setFormVisibility={setFormVisibility}
        submitting={submitting}
        onCancel={() => setSheetOpen(false)}
        onSave={() => void handleCreate()}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex max-h-[92vh] w-[min(100vw-1rem,56rem)] max-w-[min(100vw-2rem,56rem)] flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-4xl">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
            <DialogTitle className="pr-8 text-left text-base">{activeSnippet?.title}</DialogTitle>
            {activeSnippet && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={msc_statusBadgeVariant(activeSnippet.status)} className="text-[10px] capitalize">
                  {activeSnippet.status}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {msc_languageLabel(activeSnippet.language)}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {activeSnippet.visibility}
                </Badge>
              </div>
            )}
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {activeSnippet ? (
              <MSC_Projectz_SnippetViewer
                snippetId={activeSnippet.id}
                content={activeSnippet.content}
                canEdit={flags.canCreate}
                saveBusy={detailSaveBusy}
                onSaveContent={async (next) => {
                  setDetailSaveBusy(true)
                  const res = await msc_updateProjectSnippet({
                    projectId: project.id,
                    snippetId: activeSnippet.id,
                    content: next,
                  })
                  setDetailSaveBusy(false)
                  if (!res.ok) {
                    setError(res.error)
                    throw new Error(res.error)
                  }
                  setActiveSnippet({ ...activeSnippet, content: next })
                  await load()
                }}
              />
            ) : null}
          </div>
          <DialogFooter className="shrink-0 border-t border-border px-4 py-3 sm:justify-between sm:px-6">
            <Button type="button" variant="ghost" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            {showPublishInDetail && (
              <Button type="button" className="gap-1.5 bg-primary text-primary-foreground" disabled={publishBusy} onClick={() => void handlePublish()}>
                {publishBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Publish to project
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
