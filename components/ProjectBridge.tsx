'use client'

import { useState } from 'react'
import { Check, Copy, FolderOpen } from 'lucide-react'

import { msc_open_project_folder } from '@/lib/msc_native_system_bridge'

const MSC_PROJECT_ROOT = 'D:\\Cursor_Projectz\\MSC-Projectz'

export function ProjectBridge() {
  const [copied, setCopied] = useState(false)

  const msc_openExplorer = () => {
    void msc_open_project_folder(MSC_PROJECT_ROOT).catch((error) => {
      console.error('[MSC] open project bridge', error)
    })
  }

  const msc_copyPath = async () => {
    try {
      await navigator.clipboard.writeText(MSC_PROJECT_ROOT)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[MSC] copy project bridge path', error)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#1c1c1c] p-2">
      <button
        type="button"
        onClick={msc_openExplorer}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Open workspace in Explorer"
        title="Explorer"
      >
        <FolderOpen className="h-4 w-4" />
      </button>

      <p className="min-w-0 flex-1 truncate font-sans text-xs text-muted-foreground">
        {MSC_PROJECT_ROOT}
      </p>

      <button
        type="button"
        onClick={msc_copyPath}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Copy workspace path"
        title="Copy path"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}
