'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, User, Mail, ArrowLeft, Send } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { msc_login } from '@/lib/msc_vault_server_actions'
import type { AuthView } from '@/lib/types'

export function AuthScreen() {
  const { authView, setAuthView } = useAppStore()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const resetForm = () => {
    setUsername('')
    setEmail('')
    setPassword('')
    setError('')
    setShowPassword(false)
    setEmailSent(false)
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
        isVerified: Boolean(r.user?.isVerified),
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

    setEmailSent(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
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
            {authView === 'forgot-password' && 'Password Recovery'}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {authView === 'login' && 'Enter your credentials'}
            {authView === 'forgot-password' && 'Enter your email to receive a recovery link'}
          </p>
        </div>
      </div>

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
            ) : (
              'Unlock Vault'
            )}
          </Button>

          <div className="flex flex-col gap-3 pt-1 text-center text-sm">
            <Link
              href="/auth/register"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Create account
            </Link>
            <button
              type="button"
              onClick={() => handleViewChange('forgot-password')}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}

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

      <div className="absolute bottom-6 text-xs text-muted-foreground">Powered by the MSC Media Engine</div>
    </div>
  )
}
