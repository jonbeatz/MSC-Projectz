import { readdir, readFile, stat } from 'fs/promises'
import path from 'path'

export type MscVaultTreeNode = {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: MscVaultTreeNode[]
}

export type MscVaultDocument = {
  title: string
  path: string
  content: string
  breadcrumbs: string[]
}

const MSC_VAULT_CONTENT_ROOT = path.join(process.cwd(), 'content')
const MSC_MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx'])

function msc_vaultTitleFromName(name: string): string {
  return name
    .replace(/\.(md|mdx)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function msc_vaultNormalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

async function msc_readVaultDirectory(absDir: string, relativeDir = ''): Promise<MscVaultTreeNode[]> {
  let entries: string[]

  try {
    entries = await readdir(absDir)
  } catch {
    return []
  }

  const nodes = await Promise.all(
    entries.map(async (entry): Promise<MscVaultTreeNode | null> => {
      const absPath = path.join(absDir, entry)
      const relPath = msc_vaultNormalizePath(path.join(relativeDir, entry))
      const info = await stat(absPath)

      if (info.isDirectory()) {
        const children = await msc_readVaultDirectory(absPath, relPath)
        if (children.length === 0) return null
        return {
          name: entry,
          path: relPath,
          type: 'folder' as const,
          children,
        }
      }

      if (!info.isFile() || !MSC_MARKDOWN_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
        return null
      }

      return {
        name: msc_vaultTitleFromName(entry),
        path: relPath,
        type: 'file' as const,
      }
    }),
  )

  return nodes
    .filter((node): node is MscVaultTreeNode => node !== null)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export async function msc_getVaultTree(): Promise<MscVaultTreeNode[]> {
  return msc_readVaultDirectory(MSC_VAULT_CONTENT_ROOT)
}

export function msc_findFirstVaultFile(nodes: MscVaultTreeNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'file') return node.path
    const childPath = node.children ? msc_findFirstVaultFile(node.children) : null
    if (childPath) return childPath
  }
  return null
}

export async function msc_getVaultDocument(filePath: string | null): Promise<MscVaultDocument | null> {
  if (!filePath) return null

  const safePath = msc_vaultNormalizePath(filePath)
  if (safePath.startsWith('../') || path.isAbsolute(safePath)) {
    return null
  }

  const absPath = path.join(MSC_VAULT_CONTENT_ROOT, safePath)
  const info = await stat(absPath).catch(() => null)
  if (!info?.isFile() || !MSC_MARKDOWN_EXTENSIONS.has(path.extname(absPath).toLowerCase())) {
    return null
  }

  const content = await readFile(absPath, 'utf8')
  const title = msc_vaultTitleFromName(path.basename(absPath))
  const breadcrumbs = safePath.split('/').map((part) => msc_vaultTitleFromName(part))

  return {
    title,
    path: safePath,
    content,
    breadcrumbs,
  }
}
