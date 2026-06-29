'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Clipboard, Loader2, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'

type Props = {
  /** Snippet body (controlled sync from parent when id changes). */
  content: string
  /** Allow entering edit mode (vault write). */
  canEdit: boolean
  /** Persist content edits (called from Save in toolbar when editing). */
  onSaveContent?: (next: string) => Promise<void>
  /** Busy while saving. */
  saveBusy?: boolean
  /** Optional snippet id — resets local state when switching snippets. */
  snippetId?: string
}

export function MSC_Projectz_SnippetViewer({ content, canEdit, onSaveContent, saveBusy = false, snippetId }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setDraft(content)
    setEditing(false)
  }, [content, snippetId])

  const handleCopy = useCallback(async () => {
    const text = editing ? draft : content
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }, [content, draft, editing])

  const handleToggleEdit = () => {
    if (editing) {
      setDraft(content)
      setEditing(false)
      return
    }
    setDraft(content)
    setEditing(true)
  }

  const handleSaveEdits = async () => {
    if (!onSaveContent || !editing) return
    try {
      await onSaveContent(draft.trimEnd())
      setEditing(false)
    } catch {
      /* Parent sets error surface */
    }
  }

  const toolbarBtn =
    'inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-[#121212] px-2.5 text-xs font-medium text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-primary/35 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--msc-accent))] focus-visible:ring-offset-0 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-[#121212]">
      <div className="flex shrink-0 items-center justify-end gap-1.5 border-b border-border px-2 py-1.5">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={cn(
            toolbarBtn,
            copied &&
              'border-primary/60 bg-primary/10 text-primary hover:border-primary hover:bg-primary/15 hover:text-primary',
          )}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 shrink-0 transition-transform duration-200" aria-hidden />
          ) : (
            <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span
            className={cn(
              'min-w-17 text-left transition-[color,opacity] duration-200',
              copied && 'font-semibold text-primary',
            )}
          >
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
        {canEdit ? (
          <button
            type="button"
            onClick={handleToggleEdit}
            disabled={saveBusy}
            className={cn(toolbarBtn, editing && 'border-primary/40 text-primary')}
            aria-pressed={editing}
            aria-label={editing ? 'Stop editing' : 'Edit snippet'}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {editing ? 'Cancel' : 'Edit'}
          </button>
        ) : null}
        {editing && onSaveContent ? (
          <button
            type="button"
            onClick={() => void handleSaveEdits()}
            disabled={saveBusy || draft === content}
            className={cn(toolbarBtn, 'border-primary/45 text-primary hover:border-primary hover:bg-primary/10')}
          >
            {saveBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            Save
          </button>
        ) : null}
      </div>
      <textarea
        value={editing ? draft : content}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={!editing}
        spellCheck={false}
        className={cn(
          'msc-snippet-viewer-textarea min-h-[400px] w-full resize-y border-0 bg-[#121212] px-3 py-3 font-mono text-xs leading-relaxed text-foreground',
          'transition-shadow duration-200',
          editing
            ? 'cursor-text text-foreground ring-2 ring-[hsl(var(--msc-accent))]/35 ring-inset focus-visible:outline-none'
            : 'cursor-default text-foreground selection:bg-primary/20',
        )}
        aria-label="Snippet content"
      />
    </div>
  )
}
