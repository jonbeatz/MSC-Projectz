'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, User, Mail, ArrowLeft, Send, KeyRound, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { msc_login } from '@/lib/msc_vault_server_actions'
import type { AuthView } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AuthScreen() {
  const { signup, authView, setAuthView } = useAppStore()
  const router = useRouter()
  
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [signupPending, setSignupPending] = useState(false)

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidUsername = (username: string) => /^[a-zA-Z0-9]+$/.test(username)

  const resetForm = () => {
    setUsername('')
    setEmail('')
    setPassword('')
    setInviteCode('')
    setError('')
    setShowPassword(false)
    setEmailSent(false)
    setSignupPending(false)
  }

  const handleViewChange = (view: AuthView) => {
    resetForm()
    setAuthView(view)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 500))

    const msc_email = username.trim().toLowerCase()
    if (!msc_email) {
      setError('Email is required')
      setIsLoading(false)
      return
    }
    if (!isValidEmail(msc_email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setIsLoading(false)
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      setIsLoading(false)
      return
    }

    const r = await msc_login(msc_email, password)
    if (!r.success || !r.user) {
      setError(r.message || 'Invalid email or password.')
      setIsLoading(false)
      return
    }

    useAppStore.getState().msc_hardResetVaultState()
    useAppStore.setState((state) => ({
      ...state,
      isAuthenticated: true,
      projects: [],
      vaultHydrated: false,
      vaultUserId: null,
      selectedProjectId: null,
      user: {
        username: r.user?.username || (r.user?.email || msc_email).split('@')[0],
        email: r.user?.email || msc_email,
        role: r.user?.role || 'user',
        payloadUserId: r.user?.id,
        avatar: r.user?.avatarUrl || undefined,
        avatarId: r.user?.avatarId ?? null,
        avatarUrl: r.user?.avatarUrl ?? null,
      },
      authView: 'login',
      currentView: 'dashboard',
      masterPassword: null,
    }))
    router.replace('/dashboard')
    setIsLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 500))

    // Username validation - alphanumeric only
    if (!username.trim()) {
      setError('Username is required')
      setIsLoading(false)
      return
    }

    if (!isValidUsername(username)) {
      setError('Username must be alphanumeric (no spaces or special characters)')
      setIsLoading(false)
      return
    }

    // Email validation
    if (!email.trim()) {
      setError('Email is required')
      setIsLoading(false)
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    // Password validation - minimum 12 characters
    if (!password.trim()) {
      setError('Password is required')
      setIsLoading(false)
      return
    }

    if (password.length < 12) {
      setError('Master password must be at least 12 characters (this is the key to your encrypted vault)')
      setIsLoading(false)
      return
    }

    const result = signup(username, email, password, inviteCode || undefined)
    
    if (result.status === 'pending') {
      setSignupPending(true)
    }
    // If active, the store will authenticate and redirect
    
    setIsLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 1000))

    if (!email.trim()) {
      setError('Email is required')
      setIsLoading(false)
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    // Simulate sending recovery email via Spacemail SMTP
    setEmailSent(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      {/* Logo */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-card">
            <Image 
              src="/media/msc-icon.png" 
              alt="MSC-Projectz" 
              width={96} 
              height={96}
              className="object-contain"
              loading="eager"
              priority
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center bg-primary">
            <Lock className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {authView === 'login' && 'Vader Vault'}
            {authView === 'signup' && 'Create Account'}
            {authView === 'forgot-password' && 'Password Recovery'}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {authView === 'login' && 'Enter your credentials'}
            {authView === 'signup' && 'Set up your new vault account'}
            {authView === 'forgot-password' && 'Enter your email to receive a recovery link'}
          </p>
        </div>
      </div>

      {/* Login Form */}
      {authView === 'login' && (
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Input
              type="email"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 pl-12 bg-card border border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-12 pr-12 bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : 'Unlock Vault'}
          </Button>

          <div className="text-center">
            <Link
              href="/auth/register"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Don&apos;t have access? Request an account.
            </Link>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => handleViewChange('forgot-password')}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot Password?
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('signup')}
              className="text-primary transition-colors hover:text-primary/80"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Signup Form */}
      {authView === 'signup' && !signupPending && (
        <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Username (alphanumeric only)"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              className="h-12 pl-12 bg-card border border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          <div className="relative">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-12 bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Master Password (min 12 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-12 pr-12 bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password strength indicator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  password.length >= 12 && 'bg-primary',
                  password.length >= 8 && password.length < 12 && 'bg-amber-500',
                  password.length > 0 && password.length < 8 && 'bg-destructive',
                  password.length === 0 && 'bg-muted-foreground/30',
                )}
                style={{
                  width: password.length >= 12 ? '100%' : `${(password.length / 12) * 100}%`,
                }}
              />
            </div>
            <span
              className={cn(
                'text-xs',
                password.length >= 12 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {password.length}/12
            </span>
          </div>

          {/* Optional Invite Code */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Invite Code (optional - for instant access)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className={cn(
                'h-12 pl-12 bg-card border text-foreground placeholder:text-muted-foreground',
                inviteCode ? 'border-primary' : 'border-border',
              )}
            />
            <KeyRound
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5',
                inviteCode ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : inviteCode ? 'Create Account (Instant Access)' : 'Request Access'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {inviteCode 
              ? 'Valid invite code detected - instant access enabled'
              : 'Without invite code, your account will require admin approval'
            }
          </p>

          <button
            type="button"
            onClick={() => handleViewChange('login')}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </form>
      )}

      {/* Signup Pending Approval State */}
      {authView === 'signup' && signupPending && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center p-6 rounded-xl bg-card border border-primary">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/20">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Access Request Sent</h3>
            <p className="text-sm mb-4 text-muted-foreground">
              Your account is pending administrator approval. You will receive an email via Spacemail once your vault is ready.
            </p>
            <div className="p-3 rounded-lg text-xs bg-muted text-muted-foreground">
              <strong className="text-foreground">Username:</strong> {username}<br />
              <strong className="text-foreground">Email:</strong> {email}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleViewChange('login')}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      )}

      {/* Forgot Password Form */}
      {authView === 'forgot-password' && (
        <form onSubmit={handleForgotPassword} className="w-full max-w-sm space-y-4">
          {!emailSent ? (
            <>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-card border border-border text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Send Recovery Link</span>
                  </div>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary">
                <Mail className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a recovery link to <span className="text-primary">{email}</span>
              </p>
              <p className="text-xs mt-2 text-muted-foreground">Powered by Spacemail SMTP</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleViewChange('login')}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-muted-foreground">
        Powered by the MSC Media Engine
      </div>
    </div>
  )
}
