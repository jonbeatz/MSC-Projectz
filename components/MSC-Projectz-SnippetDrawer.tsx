'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Clipboard, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export const MSC_SNIPPET_LANGUAGES: { value: string; label: string }[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'css', label: 'CSS' },
  { value: 'php', label: 'PHP' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'shell', label: 'Shell' },
  { value: 'other', label: 'Other' },
]

export const MSC_SNIPPET_CATEGORIES: { value: string; label: string }[] = [
  { value: 'core-engine', label: 'Core Engine' },
  { value: 'divi-custom', label: 'Divi Custom' },
  { value: 'css-fixes', label: 'CSS Fixes' },
  { value: 'api-logic', label: 'API Logic' },
  { value: 'skills', label: 'SKILLS' },
  { value: 'rules', label: 'Rules' },
  { value: 'general', label: 'General' },
]

export function MSC_Projectz_SnippetDrawer({
  open,
  onOpenChange,
  formTitle,
  setFormTitle,
  formContent,
  setFormContent,
  formLanguage,
  setFormLanguage,
  formCategory,
  setFormCategory,
  formVisibility,
  setFormVisibility,
  submitting,
  onCancel,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formTitle: string
  setFormTitle: (v: string) => void
  formContent: string
  setFormContent: (v: string) => void
  formLanguage: string
  setFormLanguage: (v: string) => void
  formCategory: string
  setFormCategory: (v: string) => void
  formVisibility: 'personal' | 'project'
  setFormVisibility: (v: 'personal' | 'project') => void
  submitting: boolean
  onCancel: () => void
  onSave: () => void
}) {
  const [contentCopied, setContentCopied] = useState(false)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) setContentCopied(false)
    return () => {
      if (copyResetRef.current != null) clearTimeout(copyResetRef.current)
    }
  }, [open])

  const canSave = Boolean(formTitle.trim() && formContent.trim())
  const isPrivateWorkspace = formVisibility === 'personal'
  const isProjectLibrary = formVisibility === 'project'

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(formContent)
      if (copyResetRef.current != null) clearTimeout(copyResetRef.current)
      setContentCopied(true)
      copyResetRef.current = setTimeout(() => {
        setContentCopied(false)
        copyResetRef.current = null
      }, 2000)
    } catch {
      setContentCopied(false)
    }
  }

  /** Select triggers — neutral zinc focus (avoid brand `--ring`). */
  const fieldSurface =
    'w-full min-w-0 border-border transition-[color,box-shadow] focus-visible:border-zinc-600 focus-visible:ring-[3px] focus-visible:ring-zinc-700/45 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-600/40'

  /** Title + Content — reinforce zero ring atop global Studio rules. */
  const snippetTextFieldOverrides =
    '!ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!border-zinc-600'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'z-50 flex h-full max-h-dvh w-full max-w-3xl flex-col overflow-hidden border-border bg-card p-6 shadow-lg',
          'sm:max-w-3xl',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SheetHeader className="shrink-0 border-0 bg-transparent p-0 pb-4">
            <SheetTitle className="text-left">New snippet</SheetTitle>
          </SheetHeader>

          <div className="msc-snippet-drawer-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="msc-snippet-title">Title</Label>
              <Input
                id="msc-snippet-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Short label"
                className={cn(
                  'text-sm w-full min-w-0 border-border transition-[color,box-shadow]',
                  snippetTextFieldOverrides,
                )}
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full items-center justify-between gap-3">
                <Label htmlFor="msc-snippet-content" className="mb-0 shrink-0 text-sm font-medium leading-none">
                  Content
                </Label>
                <button
                  type="button"
                  onClick={() => void handleCopyContent()}
                  title={contentCopied ? 'Copied' : 'Copy content'}
                  aria-label={contentCopied ? 'Copied to clipboard' : 'Copy content to clipboard'}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-200',
                    'border-border bg-[#121212] text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    contentCopied && 'border-primary text-primary',
                  )}
                >
                  {contentCopied ? (
                    <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <Clipboard className="h-3 w-3 shrink-0" aria-hidden />
                  )}
                  <span>{contentCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <Textarea
                id="msc-snippet-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Code or notes…"
                rows={10}
                className={cn(
                  'relative z-0 min-h-[200px] resize-y font-mono text-xs w-full min-w-0 border-border transition-[color,box-shadow]',
                  snippetTextFieldOverrides,
                )}
              />
            </div>
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="msc-snippet-lang">Language</Label>
                <Select value={formLanguage} onValueChange={setFormLanguage}>
                  <SelectTrigger id="msc-snippet-lang" className={cn('w-full min-w-0', fieldSurface)}>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="msc-studio-select-content">
                    {MSC_SNIPPET_LANGUAGES.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="msc-studio-select-item">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="msc-snippet-cat">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="msc-snippet-cat" className={cn('w-full min-w-0', fieldSurface)}>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="msc-studio-select-content">
                    {MSC_SNIPPET_CATEGORIES.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="msc-studio-select-item">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="msc-snippet-vis" className="mb-0">
                  Visibility
                </Label>
                {isPrivateWorkspace ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 bg-amber-500/15 text-[10px] font-semibold uppercase tracking-wide text-amber-200"
                  >
                    Private
                  </Badge>
                ) : null}
                {isProjectLibrary ? (
                  <Badge className="bg-primary/90 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Project library
                  </Badge>
                ) : null}
              </div>
              <Select
                value={formVisibility}
                onValueChange={(v) => setFormVisibility(v as 'personal' | 'project')}
              >
                <SelectTrigger id="msc-snippet-vis" className={cn('w-full min-w-0', fieldSurface)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="msc-studio-select-content">
                  <SelectItem value="personal" className="msc-studio-select-item">
                    Personal (draft workspace)
                  </SelectItem>
                  <SelectItem value="project" className="msc-studio-select-item">
                    Project (share when published)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {isPrivateWorkspace
                  ? 'Draft stays in your workspace until you publish from the snippet detail view (when allowed).'
                  : 'When published, teammates with vault access can see this in the project library.'}
              </p>
            </div>
          </div>

          <SheetFooter className="mt-auto shrink-0 flex-row flex-wrap justify-end gap-4 border-t border-border p-0 pt-6">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              className="min-w-40 gap-1.5 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              disabled={submitting || !canSave}
              onClick={onSave}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Save draft
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
