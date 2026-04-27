'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  UserCircle,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DashboardSidebar } from './dashboard-sidebar'
import { SystemStatus } from '@/components/SystemStatus'
import { Msc_DevStatusIndicator } from '@/components/dev/msc_DevStatusIndicator'
import { msc_hasAdminAccess } from '@/lib/msc_roles'
import { UserAvatar } from '@/components/shared/user-avatar'
import { useIsMobile } from '@/lib/msc_hooks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'

interface DashboardLayoutProps {
  children: React.ReactNode
  onAddProject: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

function getSessionHeaderLabel(user: { username?: string; email?: string } | null): string {
  if (!user) return 'Loading...'
  const name = user.username?.trim()
  if (name) return name
  const email = user.email?.trim()
  if (!email) return 'Loading...'
  return email.split('@')[0] || email
}

export function DashboardLayout({ children, onAddProject, searchQuery, onSearchChange }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()
  const pathname = usePathname()
  const user = useAppStore((s) => s.user)
  const appSettings = useAppStore((s) => s.appSettings)
  const logout = useAppStore((s) => s.logout)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const setProjectViewMode = useAppStore((s) => s.setProjectViewMode)

  const isDark = appSettings.theme === 'dark'
  const isAdmin = msc_hasAdminAccess(user?.role)

  // Apply theme class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      document.documentElement.dataset.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.documentElement.dataset.theme = 'light'
    }
  }, [isDark])

  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isDashboardRoute = pathname === '/dashboard'
  const getViewTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/tasks':
        return 'Tasks'
      case '/profile':
        return 'My Profile'
      case '/settings':
        return 'System Admin'
      case '/vault':
        return 'Code Manager'
      case '/help':
        return 'Help & Documentation'
      default:
        return 'Dashboard'
    }
  }

  const sessionUserLabel = getSessionHeaderLabel(user)
  const sessionAvatar = user
    ? ((user as typeof user & { avatarUrl?: string | null }).avatarUrl || user.avatar)
    : null
  const handleSignOut = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAddProject={onAddProject}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'ml-0 flex min-h-screen flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        <header
          className={cn(
            'sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-6',
            isDark ? 'bg-background/80 backdrop-blur-md' : 'bg-background/90 backdrop-blur-md',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-foreground outline-none ring-offset-background transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex max-w-[40vw] items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold leading-none transition-colors sm:max-w-none',
                      user ? 'text-foreground hover:bg-card' : 'text-muted-foreground',
                    )}
                  >
                    <UserAvatar src={sessionAvatar} fallback={sessionUserLabel} />
                    <span className="truncate sm:inline">{sessionUserLabel}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Signed in as
                    <span className="mt-1 block truncate text-sm font-medium text-foreground">
                      {user?.email || 'Loading...'}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                      <Shield className="h-4 w-4" />
                      System Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden h-6 w-px bg-border sm:block" />

            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {getViewTitle()}
            </h1>
          </div>

          <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
            <SystemStatus />
            <Msc_DevStatusIndicator />

            {isDashboardRoute && (
              <div
                className={cn('flex items-center rounded-lg border border-border bg-card p-1', !isDark && 'card-shadow')}
              >
                <button
                  onClick={() => setProjectViewMode('grid')}
                  className={cn(
                    'rounded-md p-2 transition-colors',
                    appSettings.projectViewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  title="Grid View"
                  type="button"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setProjectViewMode('list')}
                  className={cn(
                    'rounded-md p-2 transition-colors',
                    appSettings.projectViewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  title="List View"
                  type="button"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}

            {isDashboardRoute && (
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className={cn(
                    'w-64 rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary',
                    !isDark && 'card-shadow',
                  )}
                />
              </div>
            )}

            <button
              onClick={toggleTheme}
              className={cn(
                'rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground',
                !isDark && 'card-shadow',
              )}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              type="button"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="hidden min-w-0 text-xs text-muted-foreground sm:flex sm:flex-col sm:items-end sm:leading-tight">
              <span>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 p-4 md:p-6 lg:pb-10">{children}</div>

        <footer className="z-0 mt-auto w-full p-4 text-right text-xs text-muted-foreground sm:p-4 lg:fixed lg:bottom-0 lg:right-0 lg:mt-0">
          Powered by the MSC Media Engine
        </footer>
      </main>
    </div>
  )
}
