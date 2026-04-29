'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  HelpCircle,
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  ClipboardList,
  Settings,
  X,
  Building2,
} from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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

const workspaceNav: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/tasks', label: 'Tasks', icon: ClipboardList },
]

const otherNav: NavItem[] = [
  { path: '/clients', label: 'Clients', icon: Building2, adminOnly: true },
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
  const searchParams = useSearchParams()
  const logout = useAppStore((s) => s.logout)
  const projects = useAppStore((s) => s.projects)
  const appSettings = useAppStore((s) => s.appSettings)
  const user = useAppStore((s) => s.user)

  const isDark = appSettings.theme === 'dark'
  const isAdmin = msc_hasAdminAccess(user?.role)
  const showLabels = isMobile || !collapsed
  const useGlassRail = isDark

  const [settingsGroupOpen, setSettingsGroupOpen] = useState(true)

  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setSettingsGroupOpen(true)
    }
  }, [pathname])

  const go = (path: string) => {
    router.push(path)
    if (isMobile) onMobileMenuClose()
  }

  const divider = useGlassRail ? 'border-white/10' : 'border-sidebar-border'
  const openTasksCount = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => !t.completed && !t.archived).length,
    0,
  )

  const settingsSectionActive = pathname.startsWith('/settings')
  const extrasActive = pathname.startsWith('/settings') && searchParams.get('section') === 'extras'

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const isActive = pathname === item.path
    return (
      <li key={item.path}>
        <button
          type="button"
          onClick={() => go(item.path)}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
            !showLabels && 'justify-center px-0 py-2.5',
            isActive
              ? useGlassRail
                ? 'bg-white/[0.1] text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 ring-white/12'
                : 'bg-sidebar-accent text-sidebar-foreground'
              : cn(
                  'text-muted-foreground hover:text-foreground',
                  useGlassRail ? 'hover:bg-white/[0.05]' : 'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                ),
          )}
        >
          <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
          {showLabels && <span className="min-w-0 truncate">{item.label}</span>}
          {showLabels && item.path === '/dashboard' && (
            <span className="ml-auto shrink-0 rounded-md bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {projects.length}
            </span>
          )}
          {showLabels && item.path === '/tasks' && openTasksCount > 0 && (
            <span className="ml-auto shrink-0 rounded-md bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {openTasksCount}
            </span>
          )}
        </button>
      </li>
    )
  }

  const asideClass = cn(
    'flex flex-col overflow-hidden',
    useGlassRail && 'msc-cc-nav-rail rounded-r-3xl',
    isMobile
      ? cn(
          'fixed z-50 w-64 max-w-[min(16rem,calc(100vw-1.5rem))] transform transition-transform duration-300 ease-out',
          useGlassRail ? 'top-3 bottom-3 left-3' : 'inset-y-0 left-0 h-screen border-r border-sidebar-border bg-sidebar',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          !mobileMenuOpen && 'pointer-events-none',
          !useGlassRail && 'card-shadow-lg',
        )
      : cn(
          'fixed z-40',
          useGlassRail
            ? cn('top-3 bottom-3 left-3', collapsed ? 'w-16' : 'w-64')
            : cn('left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar', collapsed ? 'w-16' : 'w-64'),
          !useGlassRail && 'card-shadow-lg',
        ),
  )

  return (
    <>
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          onClick={onMobileMenuClose}
          aria-hidden
        />
      )}

      <aside className={asideClass}>
        <div className={cn('flex shrink-0 items-center justify-between border-b px-4 py-3', divider)}>
          <div className={cn('flex min-w-0 items-center gap-3', !showLabels && 'w-full justify-center')}>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src="/media/msc-icon.png"
                alt="MSC"
                width={80}
                height={80}
                className="h-full w-full object-contain p-0.5"
                sizes="40px"
                priority
              />
            </div>
            {showLabels && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold tracking-tight text-foreground">MSC-Projectz</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Command Center
                </span>
              </div>
            )}
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={onMobileMenuClose}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            !collapsed && (
              <button
                type="button"
                onClick={onToggle}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
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
              'w-full font-semibold shadow-sm',
              showLabels ? 'justify-start gap-2' : 'px-0',
              useGlassRail &&
                'border border-white/18 bg-primary text-primary-foreground hover:border-white/25 hover:bg-primary/92',
            )}
            size={showLabels ? 'default' : 'icon'}
          >
            <Plus className="h-4 w-4" />
            {showLabels && <span>Add Project</span>}
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-2 [scrollbar-gutter:stable]">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
            Workspace
          </p>
          <ul className="space-y-1">{workspaceNav.map((item) => renderNavItem(item))}</ul>

          <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
            Other
          </p>
          <ul className="space-y-1">
            {otherNav
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => renderNavItem(item))}
            {isAdmin &&
              (showLabels ? (
                <li key="settings-group">
                  <div
                    className={cn(
                      'flex items-stretch gap-0.5 rounded-xl',
                      settingsSectionActive &&
                        !extrasActive &&
                        useGlassRail &&
                        'bg-white/[0.1] ring-1 ring-white/12 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]',
                      settingsSectionActive && !extrasActive && !useGlassRail && 'bg-sidebar-accent',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => go('/settings')}
                      className={cn(
                        'flex min-w-0 flex-1 items-center gap-3 rounded-l-xl px-3 py-3 text-left text-sm font-medium transition-colors',
                        settingsSectionActive && !extrasActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                        useGlassRail ? 'hover:bg-white/[0.04]' : '',
                      )}
                    >
                      <Settings className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                      <span className="truncate">Settings</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'flex w-10 shrink-0 items-center justify-center rounded-r-xl border-l transition-colors',
                        useGlassRail ? 'border-white/10 hover:bg-white/[0.08]' : 'border-sidebar-border hover:bg-sidebar-accent',
                      )}
                      aria-expanded={settingsGroupOpen}
                      aria-label={settingsGroupOpen ? 'Collapse Settings menu' : 'Expand Settings menu'}
                      onClick={(e) => {
                        e.preventDefault()
                        setSettingsGroupOpen((o) => !o)
                      }}
                    >
                      {settingsGroupOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                      )}
                    </button>
                  </div>
                  {settingsGroupOpen ? (
                    <ul
                      className={cn(
                        'relative mt-1 space-y-0.5 border-l pl-3 ml-4',
                        useGlassRail ? 'border-white/15' : 'border-sidebar-border',
                      )}
                    >
                      <li>
                        <button
                          type="button"
                          onClick={() => go('/settings?section=extras')}
                          className={cn(
                            'flex w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                            extrasActive
                              ? useGlassRail
                                ? 'bg-white/[0.08] text-foreground ring-1 ring-white/10'
                                : 'bg-sidebar-accent text-foreground'
                              : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                          )}
                        >
                          Extras
                        </button>
                      </li>
                    </ul>
                  ) : null}
                </li>
              ) : (
                <li key="settings-icon">
                  <button
                    type="button"
                    onClick={() => go('/settings')}
                    className={cn(
                      'flex w-full items-center justify-center rounded-xl px-0 py-2.5 transition-colors',
                      settingsSectionActive
                        ? useGlassRail
                          ? 'bg-white/[0.1] text-foreground ring-1 ring-white/12'
                          : 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                    )}
                    aria-label="Settings"
                  >
                    <Settings className="h-4 w-4 stroke-[1.5]" />
                  </button>
                </li>
              ))}
          </ul>
        </nav>

        <div className={cn('border-t p-3', divider)}>
          <button
            type="button"
            onClick={() => {
              logout()
              if (isMobile) onMobileMenuClose()
              window.location.reload()
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
              'text-muted-foreground hover:text-foreground',
              useGlassRail ? 'hover:bg-white/[0.06]' : 'hover:bg-muted/60',
              !showLabels && 'justify-center px-0 py-2.5',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" />
            {showLabels && <span>Sign Out</span>}
          </button>
        </div>

        {!isMobile && collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'absolute -right-3 top-20 z-20 flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground shadow-lg transition-colors',
              useGlassRail
                ? 'border-white/15 bg-black/50 backdrop-blur-md hover:border-white/25 hover:bg-black/60 hover:text-foreground'
                : 'border-sidebar-border bg-sidebar hover:text-foreground',
            )}
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </button>
        )}
      </aside>
    </>
  )
}
