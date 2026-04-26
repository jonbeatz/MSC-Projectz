'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, LayoutGrid, List, LogOut, Moon, Search, Shield, Sun, UserCircle } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DashboardSidebar } from './dashboard-sidebar'
import { SystemStatus } from '@/components/SystemStatus'
import { UserAvatar } from '@/components/shared/user-avatar'
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

function getDisplayName(email?: string): string {
  const value = email?.trim()
  if (!value) return 'Loading...'
  return value.split('@')[0] || value
}

export function DashboardLayout({ children, onAddProject, searchQuery, onSearchChange }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const user = useAppStore((s) => s.user)
  const appSettings = useAppStore((s) => s.appSettings)
  const logout = useAppStore((s) => s.logout)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const setProjectViewMode = useAppStore((s) => s.setProjectViewMode)

  const isDark = appSettings.theme === 'dark'
  const isAdmin = user?.role === 'admin'
  
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

  const isDashboardRoute = pathname === '/dashboard'
  const getViewTitle = () => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard'
      case '/tasks': return 'Tasks'
      case '/profile': return 'My Profile'
      case '/settings': return 'System Admin'
      case '/vault': return 'Code Manager'
      case '/help': return 'Help & Documentation'
      default: return 'Dashboard'
    }
  }

  const sessionUserLabel = user ? getDisplayName(user.email || user.username) : 'Loading...'
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
      />
      
      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Header Bar */}
        <header 
          className={cn(
            "h-16 sticky top-0 z-30 flex items-center justify-between px-6 border-b border-border",
            isDark
              ? 'bg-background/80 backdrop-blur-md'
              : 'bg-background/90 backdrop-blur-md'
          )}
        >
          <div className="flex items-center gap-4">
            {/* MSC Icon and User Info */}
            <div className="flex items-center gap-2.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold leading-none transition-colors',
                      user ? 'text-foreground hover:bg-card' : 'text-muted-foreground',
                    )}
                  >
                    <UserAvatar src={sessionAvatar} fallback={sessionUserLabel} />
                    {sessionUserLabel}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="h-6 w-px bg-border" />
            
            <h1 className="text-lg font-semibold text-foreground">{getViewTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <SystemStatus />

            {/* View Toggle (Bento Grid / List) */}
            {isDashboardRoute && (
              <div className={cn(
                'flex items-center p-1 rounded-lg border border-border bg-card',
                !isDark && 'card-shadow'
              )}>
                <button
                  onClick={() => setProjectViewMode('grid')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    appSettings.projectViewMode === 'grid' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProjectViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    appSettings.projectViewMode === 'list' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Search Field */}
            {isDashboardRoute && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className={cn(
                    'pl-10 pr-4 py-2 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary',
                    'bg-card border border-border text-foreground placeholder:text-muted-foreground',
                    !isDark && 'card-shadow'
                  )}
                />
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-colors bg-card border border-border text-muted-foreground hover:text-foreground',
                !isDark && 'card-shadow'
              )}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="fixed bottom-0 right-0 p-4 text-xs text-muted-foreground">
          Powered by the MSC Media Engine
        </footer>
      </main>
    </div>
  )
}
