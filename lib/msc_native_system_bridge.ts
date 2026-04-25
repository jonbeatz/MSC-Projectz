'use client'

/**
 * Tauri shell bridge (Phase 2). Runs only in the Tauri webview — not in Next.js server actions.
 * For browser-only dev, falls back to clipboard / vscode:// URL where applicable.
 */

import { isTauri } from '@tauri-apps/api/core'

function msc_sanitize_local_path(filePath: string): string {
  const t = filePath.trim()
  if (!t || /[\r\n]/.test(t)) {
    throw new Error('Invalid path')
  }
  return t
}

function msc_detect_windows(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Windows/i.test(navigator.userAgent)
}

function msc_detect_mac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Macintosh|Mac OS X/i.test(navigator.userAgent)
}

async function msc_fallback_copy_path(path: string, context: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(path)
  } catch {
    console.warn(`[MSC] ${context}: could not copy path`, path)
  }
}

async function msc_fallback_open_vscode(path: string): Promise<void> {
  const url = `vscode://file/${encodeURIComponent(path)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Opens a directory in the OS file manager (Explorer on Windows). */
export async function msc_open_project_folder(filePath: string): Promise<void> {
  const path = msc_sanitize_local_path(filePath)
  if (!isTauri()) {
    await msc_fallback_copy_path(path, 'explorer')
    return
  }
  const { Command } = await import('@tauri-apps/plugin-shell')
  if (msc_detect_windows()) {
    const winPath = path.replace(/\//g, '\\')
    await Command.create('msc-open-folder', [winPath]).execute()
    return
  }
  if (msc_detect_mac()) {
    await Command.create('msc-open-folder-macos', [path]).execute()
    return
  }
  await Command.create('msc-open-folder-linux', [path]).execute()
}

/** Runs `cursor .` with the project directory as cwd (Windows: `cmd /c cd /d … && cursor .`). */
export async function msc_launch_in_cursor(filePath: string): Promise<void> {
  const path = msc_sanitize_local_path(filePath)
  if (!isTauri()) {
    await msc_fallback_open_vscode(path)
    return
  }
  const { Command } = await import('@tauri-apps/plugin-shell')
  if (msc_detect_windows()) {
    const winPath = path.replace(/\//g, '\\').replace(/"/g, '""')
    await Command.create('msc-cursor-in-project', ['/c', `cd /d "${winPath}" && cursor .`]).execute()
    return
  }
  const cwd = path
  await Command.create('msc-cursor-dot', ['.'], { cwd }).execute()
}
