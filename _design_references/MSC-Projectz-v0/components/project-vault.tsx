'use client'

import { useState } from 'react'
import { 
  X, 
  Key, 
  Mail, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  Server,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import type { Project, Credential, EmailSettings } from '@/lib/types'

interface ProjectVaultProps {
  project: Project
  isOpen: boolean
  onClose: () => void
}

export function ProjectVault({ project, isOpen, onClose }: ProjectVaultProps) {
  const { addCredential, updateCredential, deleteCredential, updateEmailSettings } = useAppStore()
  
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [emailExpanded, setEmailExpanded] = useState(false)
  
  // New credential form
  const [newCredential, setNewCredential] = useState({ label: '', username: '', password: '' })
  const [showNewForm, setShowNewForm] = useState(false)

  // Email settings form
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(
    project.emailSettings || {
      email: '',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPass: '',
    }
  )

  const togglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleAddCredential = () => {
    if (newCredential.label && newCredential.username) {
      addCredential(project.id, newCredential)
      setNewCredential({ label: '', username: '', password: '' })
      setShowNewForm(false)
    }
  }

  const handleSaveEmailSettings = () => {
    updateEmailSettings(project.id, emailSettings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/80" 
        onClick={onClose} 
      />
      
      {/* Slide-out Panel */}
      <div className="relative w-full max-w-md h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 bg-card border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{project.name}</h2>
              <p className="text-xs text-muted-foreground">Project Vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Credentials Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Credentials</h3>
                <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  {project.credentials.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(!showNewForm)}
                className="gap-1.5 h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>

            {/* New Credential Form */}
            {showNewForm && (
              <div className="p-4 rounded-lg mb-4 space-y-3 bg-secondary border border-border">
                <Input
                  placeholder="Label (e.g., WP Admin)"
                  value={newCredential.label}
                  onChange={(e) => setNewCredential({ ...newCredential, label: e.target.value })}
                  className="h-9 bg-card border-border text-foreground"
                />
                <Input
                  placeholder="Username"
                  value={newCredential.username}
                  onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                  className="h-9 bg-card border-border text-foreground"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newCredential.password}
                  onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                  className="h-9 bg-card border-border text-foreground"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAddCredential} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Add Credential
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewForm(false)
                      setNewCredential({ label: '', username: '', password: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Credential List */}
            {project.credentials.length === 0 && !showNewForm ? (
              <div className="text-center py-8">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No credentials stored</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.credentials.map((cred) => (
                  <CredentialItem
                    key={cred.id}
                    credential={cred}
                    showPassword={showPasswords[cred.id] || false}
                    copiedField={copiedField}
                    onTogglePassword={() => togglePassword(cred.id)}
                    onCopy={(text, fieldId) => handleCopy(text, fieldId)}
                    onUpdate={(updates) => updateCredential(project.id, cred.id, updates)}
                    onDelete={() => deleteCredential(project.id, cred.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Email & SMTP Section */}
          <section>
            <button
              onClick={() => setEmailExpanded(!emailExpanded)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Email & SMTP</h3>
              </div>
              {emailExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {emailExpanded && (
              <div className="mt-4 p-4 rounded-lg space-y-4 bg-secondary border border-border">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email Address</Label>
                  <Input
                    placeholder="admin@example.com"
                    value={emailSettings.email}
                    onChange={(e) => setEmailSettings({ ...emailSettings, email: e.target.value })}
                    className="h-9 bg-card border-border text-foreground"
                  />
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      SMTP Settings
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Host</Label>
                      <Input
                        placeholder="smtp.example.com"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                        className="h-9 text-sm bg-card border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Port</Label>
                      <Input
                        placeholder="587"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                        className="h-9 text-sm bg-card border-border text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Username</Label>
                      <Input
                        placeholder="smtp_user"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                        className="h-9 text-sm bg-card border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Password</Label>
                      <Input
                        type="password"
                        placeholder="smtp_pass"
                        value={emailSettings.smtpPass}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                        className="h-9 text-sm bg-card border-border text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  onClick={handleSaveEmailSettings} 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Email Settings
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            All credentials are stored locally and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}

// Credential Item Component
interface CredentialItemProps {
  credential: Credential
  showPassword: boolean
  copiedField: string | null
  onTogglePassword: () => void
  onCopy: (text: string, fieldId: string) => void
  onUpdate: (updates: Partial<Credential>) => void
  onDelete: () => void
}

function CredentialItem({
  credential,
  showPassword,
  copiedField,
  onTogglePassword,
  onCopy,
  onDelete,
}: CredentialItemProps) {
  return (
    <div className="p-4 rounded-lg bg-secondary border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">{credential.label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Username Row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 rounded px-3 py-1.5 text-sm font-mono bg-card text-foreground">
          {credential.username}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground"
          onClick={() => onCopy(credential.username, `${credential.id}-user`)}
        >
          {copiedField === `${credential.id}-user` ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {/* Password Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded px-3 py-1.5 text-sm font-mono bg-card text-foreground">
          {showPassword ? credential.password : '••••••••'}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground"
          onClick={onTogglePassword}
        >
          {showPassword ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground"
          onClick={() => onCopy(credential.password, `${credential.id}-pass`)}
        >
          {copiedField === `${credential.id}-pass` ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}
