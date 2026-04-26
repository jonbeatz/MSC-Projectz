'use client'

import { 
  LayoutDashboard, 
  BookOpen,
  HelpCircle,
  LogOut,
  Plus,
  ChevronLeft,
  ClipboardList,
  Settings
} from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProjectBridge } from '@/components/ProjectBridge'
import { useAppStore } from '@/lib/store'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onAddProject: () => void
}

const navItems: { path: string; label: string; icon: React.ElementType }[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: ClipboardList },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/vault', label: 'Code Manager', icon: BookOpen },
  { path: '/help', label: 'Help', icon: HelpCircle },
]

export function DashboardSidebar({ collapsed, onToggle, onAddProject }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAppStore((s) => s.logout)
  const projects = useAppStore((s) => s.projects)
  const appSettings = useAppStore((s) => s.appSettings)
  
  const isDark = appSettings.theme === 'dark'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-16' : 'w-64',
        !isDark && 'card-shadow-lg'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image 
              src="/msc-icon.png" 
              alt="MSC" 
              width={40} 
              height={40}
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">MSC-Projectz</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Command Center
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-sidebar-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Project Button */}
      <div className={cn('p-3', collapsed && 'px-2')}>
        <Button
          onClick={onAddProject}
          className={cn(
            'w-full bg-primary text-primary-foreground hover:bg-primary/90',
            collapsed ? 'px-0' : 'justify-start gap-2'
          )}
          size={collapsed ? 'icon' : 'default'}
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>Add Project</span>}
        </Button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3">
          <ProjectBridge />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                    collapsed && 'justify-center px-0',
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-foreground' 
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.path === '/dashboard' && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      {projects.length}
                    </span>
                  )}
                  {!collapsed && item.path === '/tasks' && projects.reduce((sum, p) => sum + p.tasks.filter(t => !t.completed && !t.archived).length, 0) > 0 && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      {projects.reduce((sum, p) => sum + p.tasks.filter(t => !t.completed && !t.archived).length, 0)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => {
            localStorage.clear()
            logout()
            window.location.reload()
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle (when collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-sidebar border border-sidebar-border text-muted-foreground"
        >
          <ChevronLeft className="w-3 h-3 rotate-180" />
        </button>
      )}
    </aside>
  )
}
