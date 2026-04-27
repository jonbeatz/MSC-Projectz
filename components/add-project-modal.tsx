'use client'

import { useState, useRef } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Link2,
  Key,
  Radio,
  Plus,
  Trash2,
  Check,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import type { Credential, WizardStep } from '@/lib/types'
import { msc_compressDataUrlImage } from '@/lib/msc_compress_thumbnail'

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const steps: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'connectivity', label: 'Connectivity', icon: Link2 },
  { id: 'credentials', label: 'Credentials', icon: Key },
  { id: 'status', label: 'Status', icon: Radio },
]

/** New projects are owned by the current Payload user when a session is present; see msc_createVaultProject. */
export function AddProjectModal({ isOpen, onClose }: AddProjectModalProps) {
  const addProject = useAppStore((s) => s.addProject)
  const user = useAppStore((s) => s.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('identity')
  
  // Form state
  const [name, setName] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [localPath, setLocalPath] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [credentials, setCredentials] = useState<Omit<Credential, 'id'>[]>([])
  const [status, setStatus] = useState<'local' | 'live'>('local')
  const [localNotes, setLocalNotes] = useState('')
  const [liveNotes, setLiveNotes] = useState('')
  const [credPasswordVisible, setCredPasswordVisible] = useState<Record<number, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const msc_generateCredentialId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return `cred-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setSubmitError(null)
        setThumbnail(dataUrl)
        setThumbnailPreview(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleNext = () => {
    setSubmitError(null)
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    setSubmitError(null)
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleAddCredential = () => {
    setCredentials([...credentials, { label: '', username: '', password: '' }])
  }

  const handleUpdateCredential = (index: number, field: keyof Omit<Credential, 'id'>, value: string) => {
    const updated = [...credentials]
    updated[index] = { ...updated[index], [field]: value }
    setCredentials(updated)
  }

  const handleRemoveCredential = (index: number) => {
    setCredentials(credentials.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setSubmitError(null)

    const trimmedName = name.trim()
    const trimmedLocalPath = localPath.trim()
    const trimmedLiveUrl = liveUrl.trim()

    if (!trimmedName) {
      setSubmitError('Project name is required.')
      return
    }

    if (!trimmedLocalPath && !trimmedLiveUrl) {
      setSubmitError('Add a Local Path or Live URL before creating the project.')
      return
    }

    if (status === 'local' && !trimmedLocalPath) {
      setSubmitError('Local status requires a Local Path.')
      return
    }

    if (status === 'live' && !trimmedLiveUrl) {
      setSubmitError('Live status requires a Live URL.')
      return
    }

    const completeCredentials = credentials.filter(
      (c) => c.label.trim() && c.username.trim() && c.password.trim(),
    )
    const hasPartialCredential = credentials.some(
      (c) =>
        [c.label, c.username, c.password].some((v) => v.trim().length > 0) &&
        !(c.label.trim() && c.username.trim() && c.password.trim()),
    )

    if (hasPartialCredential) {
      setSubmitError('Complete all credential fields or remove incomplete entries.')
      return
    }

    try {
      setIsSubmitting(true)
      console.log('ADD_PROJECT: auth context before create', {
        hasPayloadUserId: user?.payloadUserId != null,
        payloadUserId: user?.payloadUserId ?? null,
        email: user?.email ?? null,
        headerFormat: 'server-action httpOnly Payload cookie; no client Authorization header',
      })
      let thumbOut = (thumbnailPreview || thumbnail).trim()
      if (thumbOut.startsWith('data:image/')) {
        thumbOut = await msc_compressDataUrlImage(thumbOut)
      }
      await addProject({
        name: trimmedName,
        thumbnail: thumbOut || undefined,
        localPath: trimmedLocalPath,
        liveUrl: trimmedLiveUrl || undefined,
        status,
        localNotes: localNotes.trim() || undefined,
        liveNotes: liveNotes.trim() || undefined,
        references: [],
        credentials: completeCredentials.map((c) => ({ ...c, id: msc_generateCredentialId() })),
        tasks: [],
      })
      handleClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create project. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setCurrentStep('identity')
    setName('')
    setThumbnail('')
    setThumbnailPreview(null)
    setLocalPath('')
    setLiveUrl('')
    setCredentials([])
    setStatus('local')
    setLocalNotes('')
    setLiveNotes('')
    setCredPasswordVisible({})
    setIsSubmitting(false)
    setSubmitError(null)
    onClose()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'identity':
        return name.trim().length > 0
      case 'connectivity':
        return localPath.trim().length > 0 || liveUrl.trim().length > 0
      case 'credentials':
        return true // Optional step
      case 'status':
        return status === 'local' ? localPath.trim().length > 0 : liveUrl.trim().length > 0
      default:
        return false
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/80" 
        onClick={handleClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Project</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex
            
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : 
                      isCompleted ? "bg-primary/20 text-primary" : 
                      "bg-secondary text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden sm:block",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-px mx-2",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          {/* Step 1: Identity */}
          {currentStep === 'identity' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Project Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border text-foreground"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-foreground">Thumbnail URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/image.jpg"
                    value={thumbnailPreview ? '' : thumbnail}
                    onChange={(e) => {
                      setThumbnail(e.target.value)
                      setThumbnailPreview(null)
                    }}
                    disabled={!!thumbnailPreview}
                    className="bg-input border-border text-foreground disabled:opacity-50"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload local image"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add a screenshot or logo for visual identification
                </p>
                
                {/* Thumbnail Preview */}
                {thumbnailPreview && (
                  <div className="mt-3 relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-secondary border border-border">
                      <img 
                        src={thumbnailPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-black/80 text-white hover:bg-black/90"
                      onClick={() => {
                        setThumbnail('')
                        setThumbnailPreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Connectivity */}
          {currentStep === 'connectivity' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="localPath" className="text-foreground">Local Path</Label>
                <Input
                  id="localPath"
                  placeholder="Enter the project root path"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  className="font-mono text-sm bg-input border-border text-foreground"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Full path to your project directory
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveUrl" className="text-foreground">Live URL (Optional)</Label>
                <Input
                  id="liveUrl"
                  placeholder="https://myproject.com"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Production website URL if deployed
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Credentials */}
          {currentStep === 'credentials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Vault Entries</h3>
                  <p className="text-xs text-muted-foreground">
                    Store login credentials securely
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddCredential}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>

              {credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Key className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No credentials added yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Add&quot; to store login details
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {credentials.map((cred, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg space-y-2 bg-secondary border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Label (e.g., WP Admin)"
                          value={cred.label}
                          onChange={(e) => handleUpdateCredential(index, 'label', e.target.value)}
                          className="h-8 text-sm bg-card border-border text-foreground"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveCredential(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Username"
                          value={cred.username}
                          onChange={(e) => handleUpdateCredential(index, 'username', e.target.value)}
                          className="h-8 text-sm bg-card border-border text-foreground"
                        />
                        <div className="relative">
                          <Input
                            type={credPasswordVisible[index] ? 'text' : 'password'}
                            placeholder="Password"
                            value={cred.password}
                            onChange={(e) => handleUpdateCredential(index, 'password', e.target.value)}
                            className="h-8 text-sm bg-card border-border text-foreground pr-9"
                          />
                          <button
                            type="button"
                            aria-label={credPasswordVisible[index] ? 'Hide password' : 'Show password'}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() =>
                              setCredPasswordVisible((prev) => ({
                                ...prev,
                                [index]: !prev[index],
                              }))
                            }
                          >
                            {credPasswordVisible[index] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Status */}
          {currentStep === 'status' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1 text-foreground">Project Status</h3>
                <p className="text-xs text-muted-foreground">
                  Is this project running locally or deployed live?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('local')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    status === 'local' 
                      ? "border-primary bg-primary/10" 
                      : "border-border bg-transparent hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        status === 'local' ? "border-primary" : "border-muted-foreground"
                      )}
                    >
                      {status === 'local' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-foreground">Local</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Development environment
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('live')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    status === 'live' 
                      ? "border-primary bg-primary/10" 
                      : "border-border bg-transparent hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        status === 'live' ? "border-primary" : "border-muted-foreground"
                      )}
                    >
                      {status === 'live' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-foreground">Live</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deployed to production
                  </p>
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local-notes" className="text-foreground text-xs">
                  Local / dev notes
                </Label>
                <Textarea
                  id="local-notes"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Paths, ports, Docker, local-only credentials…"
                  rows={3}
                  className="resize-y bg-input border-border text-foreground text-sm min-h-[72px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="live-notes" className="text-foreground text-xs">
                  Live / production notes
                </Label>
                <Textarea
                  id="live-notes"
                  value={liveNotes}
                  onChange={(e) => setLiveNotes(e.target.value)}
                  placeholder="Deploy notes, CDN, DNS, cPanel paths…"
                  rows={3}
                  className="resize-y bg-input border-border text-foreground text-sm min-h-[72px]"
                />
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/50">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStepIndex === steps.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!canProceed() || isSubmitting}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
              <Check className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed()} 
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
