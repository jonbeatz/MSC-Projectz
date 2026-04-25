'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, AlertCircle, CheckCircle, Clock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import type { RegisteredUser } from '@/lib/types'

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { users, inviteUser, deleteUser, updateUserStatus, user } = useAppStore()

  const isAdmin = user?.role === 'admin'

  // Separate pending and active users
  const pendingUsers = users.filter(u => u.status === 'pending')
  const activeUsers = users.filter(u => u.status === 'active')

  const handleInviteUser = () => {
    if (!username.trim() || !email.trim() || !tempPassword.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' })
      return
    }

    if (tempPassword.length < 6) {
      setMessage({ type: 'error', text: 'Temporary password must be at least 6 characters' })
      return
    }

    if (users.some(u => u.username === username)) {
      setMessage({ type: 'error', text: 'Username already exists' })
      return
    }

    inviteUser(username, email, tempPassword)
    setMessage({ type: 'success', text: 'User invited successfully! Credentials sent via email.' })
    setUsername('')
    setEmail('')
    setTempPassword('')
    setTimeout(() => {
      setShowInviteForm(false)
      setMessage(null)
    }, 2000)
  }

  const handleDeleteUser = (userId: string) => {
    if (deleteUser(userId)) {
      setMessage({ type: 'success', text: 'User deleted successfully' })
      setDeleteConfirm(null)
      setTimeout(() => setMessage(null), 2000)
    }
  }

  const handleToggleStatus = (userId: string, currentStatus: 'pending' | 'active') => {
    const newStatus = currentStatus === 'pending' ? 'active' : 'pending'
    if (updateUserStatus(userId, newStatus)) {
      setMessage({ 
        type: 'success', 
        text: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` 
      })
      setTimeout(() => setMessage(null), 2000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary" />
            User Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Message */}
          {message && !showInviteForm && (
            <div 
              className="flex items-center gap-2 text-sm p-3 rounded-lg"
              style={{ 
                backgroundColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? '#4ADE80' : '#EF4444' 
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          {/* Invite New User Section */}
          {isAdmin && (
            <div className="space-y-4">
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full bg-secondary text-primary hover:bg-secondary/80"
              >
                <Plus className="w-4 h-4" />
                Invite New User
              </button>

              {showInviteForm && (
                <div className="p-4 rounded-lg space-y-4 bg-secondary border border-border">
                  <div className="space-y-2">
                    <Label htmlFor="invite-username" className="text-sm text-muted-foreground">
                      Username
                    </Label>
                    <Input
                      id="invite-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="new_user"
                      className="bg-card border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-email" className="text-sm text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="bg-card border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-password" className="text-sm text-muted-foreground">
                      Temporary Master Password
                    </Label>
                    <Input
                      id="invite-password"
                      type="password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="bg-card border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      User will be prompted to change this password on first login
                    </p>
                  </div>

                  {message && (
                    <div 
                      className="flex items-center gap-2 text-sm"
                      style={{ color: message.type === 'success' ? '#4ADE80' : '#EF4444' }}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {message.text}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleInviteUser}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Send Invite
                    </Button>
                    <Button
                      onClick={() => setShowInviteForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Users Section */}
          {pendingUsers.length > 0 && isAdmin && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2 text-yellow-500">
                <Clock className="w-4 h-4" />
                Pending Approval ({pendingUsers.length})
              </h3>
              <div className="space-y-2">
                {pendingUsers.map((u) => (
                  <div 
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-yellow-500"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {u.username}
                        <span className="ml-2 text-xs px-2 py-0.5 rounded uppercase bg-yellow-500/20 text-yellow-500">
                          Pending
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleToggleStatus(u.id, 'pending')}
                        className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Activate
                      </Button>
                      {deleteConfirm === u.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                            variant="secondary"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-destructive/20 text-destructive"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Users List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Active Users ({activeUsers.length + 1})
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {/* Current User (Admin) */}
              {user && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-primary">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user.username}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                        Admin
                      </span>
                      {user.role === 'admin' && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Other Active Users */}
              {activeUsers.map((u) => (
                <div 
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {u.username}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                        Active
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {isAdmin && (
                    <>
                      {deleteConfirm === u.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                            variant="secondary"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-destructive/20 text-destructive"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
