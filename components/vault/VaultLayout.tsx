'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, FileText, Pencil, Plus, Save, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { msc_getScopedKey } from '@/lib/msc_scoped_storage'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type MscVaultSnippet = {
  id: string
  title: string
  content: string
  updatedAt: string
}

const MSC_VAULT_SNIPPETS_KEY = 'msc-projectz-vault-snippets'

function msc_createSnippetId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `snippet-${Date.now()}`
}

function msc_createEmptySnippet(): MscVaultSnippet {
  return {
    id: msc_createSnippetId(),
    title: 'Untitled Snippet',
    content: '',
    updatedAt: new Date().toISOString(),
  }
}

export function VaultLayout() {
  const userId = useAppStore((s) => s.user?.payloadUserId)
  const [snippets, setSnippets] = useState<MscVaultSnippet[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('Untitled Snippet')
  const [draftContent, setDraftContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null)

  useEffect(() => {
    if (userId === undefined || userId === null) {
      setLoadedStorageKey(null)
      setSnippets([])
      setActiveId(null)
      setDraftTitle('Untitled Snippet')
      setDraftContent('')
      return
    }

    const scopedKey = msc_getScopedKey(MSC_VAULT_SNIPPETS_KEY, userId)
    setLoadedStorageKey(null)
    try {
      setSnippets([])
      setActiveId(null)
      setDraftTitle('Untitled Snippet')
      setDraftContent('')
      const stored = window.localStorage.getItem(scopedKey)
      if (!stored) {
        setLoadedStorageKey(scopedKey)
        return
      }

      const parsed = JSON.parse(stored) as MscVaultSnippet[]
      if (Array.isArray(parsed)) {
        setSnippets(parsed)
        const firstSnippet = parsed[0]
        if (firstSnippet) {
          setActiveId(firstSnippet.id)
          setDraftTitle(firstSnippet.title)
          setDraftContent(firstSnippet.content)
        }
      }
      setLoadedStorageKey(scopedKey)
    } catch (error) {
      console.error('[MSC] Failed to load vault snippets', error)
      setLoadedStorageKey(scopedKey)
    }
  }, [userId])

  useEffect(() => {
    if (userId === undefined || userId === null) return
    const scopedKey = msc_getScopedKey(MSC_VAULT_SNIPPETS_KEY, userId)
    if (loadedStorageKey !== scopedKey) return
    window.localStorage.setItem(scopedKey, JSON.stringify(snippets))
  }, [loadedStorageKey, snippets, userId])

  const activeSnippet = useMemo(
    () => snippets.find((snippet) => snippet.id === activeId) ?? null,
    [activeId, snippets],
  )

  const msc_handleNewSnippet = () => {
    setActiveId(null)
    setDraftTitle('Untitled Snippet')
    setDraftContent('')
    setCopied(false)
  }

  const msc_handleSelectSnippet = (snippet: MscVaultSnippet) => {
    setActiveId(snippet.id)
    setDraftTitle(snippet.title)
    setDraftContent(snippet.content)
    setCopied(false)
  }

  const msc_handleDeleteSnippet = (snippetId: string) => {
    setSnippets((current) => current.filter((snippet) => snippet.id !== snippetId))
    setActiveId(null)
    setDraftTitle('Untitled Snippet')
    setDraftContent('')
    setCopied(false)
  }

  const msc_handleSaveSnippet = () => {
    const title = draftTitle.trim() || 'Untitled Snippet'
    const updatedAt = new Date().toISOString()

    if (activeSnippet) {
      setSnippets((current) =>
        current.map((snippet) =>
          snippet.id === activeSnippet.id
            ? { ...snippet, title, content: draftContent, updatedAt }
            : snippet,
        ),
      )
      return
    }

    const nextSnippet = {
      ...msc_createEmptySnippet(),
      title,
      content: draftContent,
      updatedAt,
    }
    setSnippets((current) => [nextSnippet, ...current])
    setActiveId(nextSnippet.id)
  }

  const msc_handleCopySnippet = async () => {
    await navigator.clipboard.writeText(draftContent)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background text-foreground">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          MSC Code Manager
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Code Manager</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Store reusable commands, snippets, notes, and credentials-adjacent references locally in this browser.
        </p>
      </div>

      <div className="grid min-h-[640px] overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-border bg-surface lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Snippets</h2>
              <p className="text-xs text-muted-foreground">{snippets.length} saved</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={msc_handleNewSnippet}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {snippets.length === 0 ? (
              <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                No snippets yet. Create your first saved code block with the editor.
              </div>
            ) : (
              <div className="space-y-2">
                {snippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      activeId === snippet.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background/40 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => msc_handleSelectSnippet(snippet)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate text-sm font-medium">{snippet.title}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => msc_handleSelectSnippet(snippet)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={`Edit ${snippet.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => msc_handleDeleteSnippet(snippet.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={`Delete ${snippet.title}`}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => msc_handleSelectSnippet(snippet)}
                      className="mt-2 line-clamp-2 w-full text-left text-xs"
                    >
                      {snippet.content || 'Empty snippet'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="vault-snippet-title" className="sr-only">
                Snippet title
              </label>
              <Input
                id="vault-snippet-title"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                className="border-border bg-background text-sm font-sans text-foreground"
                placeholder="Snippet title"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={msc_handleSaveSnippet}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                Save Snippet
              </Button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 p-4">
            <label htmlFor="vault-snippet-content" className="sr-only">
              Snippet content
            </label>
            <button
              type="button"
              onClick={msc_handleCopySnippet}
              disabled={!draftContent.trim()}
              className="absolute right-7 top-7 rounded-md border border-border bg-surface p-2 text-muted-foreground shadow-xl transition-colors hover:border-primary/50 hover:bg-surface/80 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              aria-label="Copy editor text"
            >
              <Copy className="h-4 w-4" />
            </button>
            {copied && (
              <p className="absolute right-7 top-20 rounded-md border border-primary/30 bg-surface px-2 py-1 text-xs text-primary">
                Copied!
              </p>
            )}
            <textarea
              id="vault-snippet-content"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              spellCheck={false}
              placeholder="Paste code, commands, prompts, or notes here..."
              className="min-h-[520px] w-full resize-none rounded-lg border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </section>
      </div>
    </main>
  )
}
