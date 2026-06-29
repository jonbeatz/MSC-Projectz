'use client'

import { useState, useEffect } from 'react'
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
  ChevronUp,
  Send,
  Loader2,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import type { Project, Credential, EmailSettings, MscSmtpEncryption } from '@/lib/types'
import { msc_testProjectSmtpConnection } from '@/lib/msc_vault_server_actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  const msc_defaultEmail = (): EmailSettings => ({
    incoming: { host: '', port: 993, username: '', password: '' },
    outgoing: { host: '', port: 465, username: '', password: '', encryption: 'ssl' },
  })

  const [emailSettings, setEmailSettings] = useState<EmailSettings>(project.emailSettings || msc_defaultEmail())
  const [showImapPass, setShowImapPass] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [emailTestBusy, setEmailTestBusy] = useState(false)
  const [emailTestMessage, setEmailTestMessage] = useState<string | null>(null)

  useEffect(() => {
    setEmailSettings(project.emailSettings || msc_defaultEmail())
    setEmailTestMessage(null)
  }, [project.id, project.emailSettings])

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

  const handleTestEmail = async () => {
    setEmailTestMessage(null)
    setEmailTestBusy(true)
    const r = await msc_testProjectSmtpConnection(project.id, {
      host: emailSettings.outgoing.host,
      port: emailSettings.outgoing.port,
      username: emailSettings.outgoing.username,
      password: emailSettings.outgoing.password || undefined,
      encryption: emailSettings.outgoing.encryption,
    })
    setEmailTestBusy(false)
    setEmailTestMessage(r.success ? r.message : r.message)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/80" onClick={onClose} />

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
              <Button variant="ghost" size="sm" onClick={() => setShowNewForm(!showNewForm)} className="gap-1.5 h-8">
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
                <h3 className="font-medium text-foreground">IMAP & SMTP</h3>
              </div>
              {emailExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {emailExpanded && (
              <div className="mt-4 p-4 rounded-lg space-y-4 bg-[#1c1c1c] border border-border">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Server className="h-3.5 w-3.5" />
                  Same as Edit Project → SMTP
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-foreground">IMAP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Host</Label>
                        <Input
                          value={emailSettings.incoming.host}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              incoming: { ...emailSettings.incoming, host: e.target.value },
                            })
                          }
                          className="h-8 text-xs bg-card border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Port</Label>
                        <Input
                          type="number"
                          value={emailSettings.incoming.port || 993}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              incoming: {
                                ...emailSettings.incoming,
                                port: parseInt(e.target.value, 10) || 0,
                              },
                            })
                          }
                          className="h-8 text-xs bg-card border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Username</Label>
                      <Input
                        value={emailSettings.incoming.username}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            incoming: { ...emailSettings.incoming, username: e.target.value },
                          })
                        }
                        className="h-8 text-xs bg-card border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Password</Label>
                      <div className="relative">
                        <Input
                          type={showImapPass ? 'text' : 'password'}
                          value={emailSettings.incoming.password}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              incoming: { ...emailSettings.incoming, password: e.target.value },
                            })
                          }
                          className="h-8 pr-8 text-xs bg-card border-border text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setShowImapPass((s) => !s)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showImapPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-foreground">SMTP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Host</Label>
                        <Input
                          value={emailSettings.outgoing.host}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              outgoing: { ...emailSettings.outgoing, host: e.target.value },
                            })
                          }
                          className="h-8 text-xs bg-card border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Port</Label>
                        <Input
                          type="number"
                          value={emailSettings.outgoing.port || 465}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              outgoing: {
                                ...emailSettings.outgoing,
                                port: parseInt(e.target.value, 10) || 0,
                              },
                            })
                          }
                          className="h-8 text-xs bg-card border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Username</Label>
                      <Input
                        value={emailSettings.outgoing.username}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            outgoing: { ...emailSettings.outgoing, username: e.target.value },
                          })
                        }
                        className="h-8 text-xs bg-card border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Password</Label>
                      <div className="relative">
                        <Input
                          type={showSmtpPassword ? 'text' : 'password'}
                          value={emailSettings.outgoing.password}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              outgoing: { ...emailSettings.outgoing, password: e.target.value },
                            })
                          }
                          className="h-8 pr-8 text-xs bg-card border-border text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword((s) => !s)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showSmtpPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">Encryption</span>
                      <Select
                        value={emailSettings.outgoing.encryption}
                        onValueChange={(v) =>
                          setEmailSettings({
                            ...emailSettings,
                            outgoing: { ...emailSettings.outgoing, encryption: v as MscSmtpEncryption },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 bg-card border-border text-foreground w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {emailTestMessage && <p className="text-xs text-muted-foreground">{emailTestMessage}</p>}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleTestEmail}
                    disabled={emailTestBusy}
                    className="gap-1.5"
                  >
                    {emailTestBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Test
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEmailSettings}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">All credentials are stored locally and encrypted</p>
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
          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
