'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MscVaultDocument } from '@/lib/vault-content'

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const codeText = String(children).replace(/\n$/, '')
  const language = className?.replace('language-', '') || 'text'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--msc-accent))]">{language}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
          className="h-8 gap-1.5 border-border bg-background text-xs text-muted-foreground hover:border-[hsl(var(--msc-accent))] hover:text-[hsl(var(--msc-accent))]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="msc-vault-code overflow-x-auto p-4 text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[hsl(var(--msc-accent))]">
      {children}
    </code>
  )
}

export function MarkdownViewer({ document }: { document: MscVaultDocument | null }) {
  if (!document) {
    return (
      <div className="flex min-h-screen flex-1 flex-col p-8">
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--msc-accent))]">
              Code Manager
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">No document selected</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add Markdown files under `content/` or select an existing document from the sidebar.
            </p>
          </div>
        </div>
        <footer className="mt-6 text-xs text-muted-foreground">Powered by the MSC Media Engine</footer>
      </div>
    )
  }

  return (
    <article className="flex min-h-screen flex-1 flex-col p-8">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <span>Home</span>
        {document.breadcrumbs.map((crumb) => (
          <span key={crumb} className="flex items-center gap-2">
            <span className="text-[hsl(var(--msc-accent))]">/</span>
            <span>{crumb}</span>
          </span>
        ))}
      </nav>

      <div className="flex-1 rounded-2xl border border-border bg-card p-8">
        <header className="mb-8 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--msc-accent))]">
            Code Manager
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{document.title}</h1>
        </header>

        <div className="msc-vault-prose max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              code(props) {
                const { children, className } = props
                const inline = !className
                if (inline) {
                  return <InlineCode>{children}</InlineCode>
                }
                return <CodeBlock className={className}>{children}</CodeBlock>
              },
              a({ children, className, ...props }) {
                return (
                  <a
                    {...props}
                    className={cn('text-[hsl(var(--msc-accent))] underline-offset-4 hover:underline', className)}
                  >
                    {children}
                  </a>
                )
              },
            }}
          >
            {document.content}
          </ReactMarkdown>
        </div>
      </div>

      <footer className="mt-6 text-xs text-muted-foreground">Powered by the MSC Media Engine</footer>
    </article>
  )
}
