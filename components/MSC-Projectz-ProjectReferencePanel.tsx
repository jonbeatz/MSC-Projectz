'use client'

import { FileText, Link2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project } from '@/lib/types'

interface MSC_Projectz_ProjectReferencePanelProps {
  project: Project
  onOpenRefsInEditor: () => void
}

export function MSC_Projectz_ProjectReferencePanel({
  project,
  onOpenRefsInEditor,
}: MSC_Projectz_ProjectReferencePanelProps) {
  const refs = project.references ?? []
  const ln = project.localNotes?.trim()
  const liv = project.liveNotes?.trim()

  return (
    <div className="mt-6 rounded-xl border border-border bg-card/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Environment & references
        </h3>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onOpenRefsInEditor}>
          <Pencil className="w-3 h-3" />
          Edit
        </Button>
      </div>
      {(ln || liv) && (
        <div className="space-y-2 text-xs text-muted-foreground">
          {ln ? (
            <p>
              <span className="font-medium text-foreground">Local:</span> {ln.slice(0, 160)}
              {ln.length > 160 ? '…' : ''}
            </p>
          ) : null}
          {liv ? (
            <p>
              <span className="font-medium text-foreground">Live:</span> {liv.slice(0, 160)}
              {liv.length > 160 ? '…' : ''}
            </p>
          ) : null}
        </div>
      )}
      {refs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reference links or files yet.</p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {refs.map((r) => (
            <li key={r.id} className="flex items-start gap-2 text-xs">
              {r.kind === 'link' ? (
                <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              ) : (
                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{r.title}</p>
                {r.kind === 'link' && r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    Open
                  </a>
                ) : null}
                {r.kind === 'file' && r.fileDataUrl ? (
                  <a
                    href={r.fileDataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {r.fileName || 'View file'}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
