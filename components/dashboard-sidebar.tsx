'use client'

import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  LogOut,
  Plus,
  ChevronLeft,
  Calendar,
  ClipboardList,
  Settings,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { msc_hasAdminAccess } from '@/lib/msc_roles'

export interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
  onAddProject: () => void
  isMobile: boolean
  mobileMenuOpen: boolean
  onMobileMenuClose: () => void
}

type NavItem = {
  path: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/tasks', label: 'Tasks', icon: ClipboardList },
  { path: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { path: '/vault', label: 'Code Manager', icon: BookOpen },
  { path: '/help', label: 'Engine', icon: HelpCircle },
]

export function DashboardSidebar({
  collapsed,
  onToggle,
  onAddProject,
  isMobile,
  mobileMenuOpen,
  onMobileMenuClose,
}: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAppStore((s) => s.logout)
  const projects = useAppStore((s) => s.projects)
  const user = useAppStore((s) => s.user)
  const appSettings = useAppStore((s) => s.appSettings)

  const isDark = appSettings.theme === 'dark'
  const isAdmin = msc_hasAdminAccess(user?.role)
  const showLabels = isMobile || !collapsed

  const go = (path: string) => {
    router.push(path)
    if (isMobile) onMobileMenuClose()
  }

  return (
    <>
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onMobileMenuClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'flex h-screen flex-col border-r border-sidebar-border bg-sidebar',
          isMobile
            ? [
                'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300',
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
                !mobileMenuOpen && 'pointer-events-none',
                !isDark && 'card-shadow-lg',
              ]
            : [
                'fixed left-0 top-0 z-40 transition-all duration-300',
                collapsed ? 'w-16' : 'w-64',
                !isDark && 'card-shadow-lg',
              ],
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <div className={cn('flex items-center gap-3', !showLabels && 'w-full justify-center')}>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/media/msc-icon.png"
                alt="MSC"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            {showLabels && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-semibold text-sidebar-foreground">MSC-Projectz</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Command Center
                </span>
              </div>
            )}
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={onMobileMenuClose}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-sidebar-foreground"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            !collapsed && (
              <button
                type="button"
                onClick={onToggle}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-sidebar-foreground"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )
          )}
        </div>

        <div className={cn('p-3', !showLabels && 'px-2')}>
          <Button
            onClick={() => {
              onAddProject()
              if (isMobile) onMobileMenuClose()
            }}
            className={cn(
              'w-full bg-primary text-primary-foreground hover:bg-primary/90',
              showLabels ? 'justify-start gap-2' : 'px-0',
            )}
            size={showLabels ? 'default' : 'icon'}
          >
            <Plus className="h-4 w-4" />
            {showLabels && <span>Add Project</span>}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => go(item.path)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        !showLabels && 'justify-center px-0',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {showLabels && <span>{item.label}</span>}
                      {showLabels && item.path === '/dashboard' && (
                        <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                          {projects.length}
                        </span>
                      )}
                      {showLabels &&
                        item.path === '/tasks' &&
                        projects.reduce(
                          (sum, p) => sum + p.tasks.filter((t) => !t.completed && !t.archived).length,
                          0,
                        ) > 0 && (
                          <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                            {projects.reduce(
                              (sum, p) => sum + p.tasks.filter((t) => !t.completed && !t.archived).length,
                              0,
                            )}
                          </span>
                        )}
                    </button>
                  </li>
                )
              })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => {
              logout()
              if (isMobile) onMobileMenuClose()
              window.location.reload()
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
              !showLabels && 'justify-center px-0',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabels && <span>Sign Out</span>}
          </button>
        </div>

        {!isMobile && collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </button>
        )}
      </aside>
    </>
  )
}
