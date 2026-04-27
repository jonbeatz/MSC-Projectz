'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Folder, Search } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { MscVaultTreeNode } from '@/lib/vault-content'

function msc_filterTree(nodes: MscVaultTreeNode[], query: string): MscVaultTreeNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return nodes

  return nodes
    .map<MscVaultTreeNode | null>((node) => {
      const selfMatch = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)
      const children = node.children ? msc_filterTree(node.children, q) : []

      if (selfMatch || children.length > 0) {
        return {
          ...node,
          children: node.type === 'folder' ? children : undefined,
        }
      }

      return null
    })
    .filter((node): node is MscVaultTreeNode => node !== null)
}

function VaultTreeNode({
  node,
  activePath,
  depth,
}: {
  node: MscVaultTreeNode
  activePath: string | null
  depth: number
}) {
  const [isOpen, setIsOpen] = useState(true)
  const isActive = node.type === 'file' && node.path === activePath

  if (node.type === 'folder') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-center gap-2 border-l-2 border-transparent py-2 pr-3 text-left text-sm text-muted-foreground transition-colors hover:border-l-[hsl(var(--msc-accent))] hover:bg-secondary/60 hover:text-foreground"
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <Folder className="h-4 w-4 text-[hsl(var(--msc-accent))]" />
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children?.map((child) => (
          <VaultTreeNode key={child.path} node={child} activePath={activePath} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <Link
      href={`/vault?file=${encodeURIComponent(node.path)}`}
      className={cn(
        'flex items-center gap-2 border-l-2 py-2 pr-3 text-sm transition-colors',
        isActive
          ? 'border-l-[hsl(var(--msc-accent))] bg-secondary text-foreground'
          : 'border-transparent text-muted-foreground hover:border-l-[hsl(var(--msc-accent))] hover:bg-secondary/60 hover:text-foreground',
      )}
      style={{ paddingLeft: `${12 + depth * 14}px` }}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{node.name}</span>
    </Link>
  )
}

export function VaultSidebar({
  tree,
  activePath,
}: {
  tree: MscVaultTreeNode[]
  activePath: string | null
}) {
  const [query, setQuery] = useState('')
  const filteredTree = useMemo(() => msc_filterTree(tree, query), [tree, query])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--msc-accent))]">
          Code Manager
        </p>
        <h1 className="mt-1 text-lg font-semibold text-foreground">Docs + Snippets</h1>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-[hsl(var(--msc-accent))] focus:ring-1 focus:ring-[hsl(var(--msc-accent))]"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {filteredTree.length > 0 ? (
          filteredTree.map((node) => (
            <VaultTreeNode key={node.path} node={node} activePath={activePath} depth={0} />
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">No matching files.</p>
        )}
      </nav>
    </aside>
  )
}
