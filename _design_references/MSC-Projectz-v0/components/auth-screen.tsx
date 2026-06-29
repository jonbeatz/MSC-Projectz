'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, User, Mail, ArrowLeft, Send, KeyRound, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import type { AuthView } from '@/lib/types'

export function AuthScreen() {
  const { login, signup, masterPassword, authView, setAuthView } = useAppStore()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [signupPending, setSignupPending] = useState(false)

  const isFirstTime = !masterPassword

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

    if (!username.trim()) {
      setError('Username is required')
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Master password is required')
      setIsLoading(false)
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      setIsLoading(false)
      return
    }

    const success = login(username, password)
    if (!success) {
      setError('Invalid master password')
    }
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

    // Master password validation - minimum 12 characters
    if (!password.trim()) {
      setError('Master password is required')
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#121212' }}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#2a2a2a] flex items-center justify-center"
            style={{ backgroundColor: '#1c1c1c' }}
          >
            <Image
              src="/msc-icon.png"
              alt="MSC-Projectz"
              width={96}
              height={96}
              className="object-contain"
              loading="eager"
              priority
            />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#4ADE80' }}
          >
            <Lock className="w-4 h-4" style={{ color: '#121212' }} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#f5f5f5' }}>
            {authView === 'login' && 'Vader Vault'}
            {authView === 'signup' && 'Create Account'}
            {authView === 'forgot-password' && 'Password Recovery'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            {authView === 'login' && (isFirstTime ? 'Create your account to get started' : 'Enter your credentials')}
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
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 pl-12"
              style={{
                backgroundColor: '#1c1c1c',
                borderColor: '#2a2a2a',
                color: '#f5f5f5',
              }}
              autoFocus
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-12 pr-12"
              style={{
                backgroundColor: '#1c1c1c',
                borderColor: '#2a2a2a',
                color: '#f5f5f5',
              }}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#888888' }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#EF4444' }}>
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 font-medium"
            style={{ backgroundColor: '#4ADE80', color: '#121212' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#121212]/30 border-t-[#121212] rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : isFirstTime ? (
              'Create Vault'
            ) : (
              'Unlock Vault'
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => handleViewChange('forgot-password')}
              className="transition-colors hover:text-[#f5f5f5]"
              style={{ color: '#888888' }}
            >
              Forgot Password?
            </button>
            {isFirstTime && (
              <button
                type="button"
                onClick={() => handleViewChange('signup')}
                className="transition-colors hover:text-[#4ADE80]"
                style={{ color: '#4ADE80' }}
              >
                Create Account
              </button>
            )}
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
              className="h-12 pl-12"
              style={{
                backgroundColor: '#1c1c1c',
                borderColor: '#2a2a2a',
                color: '#f5f5f5',
              }}
              autoFocus
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
          </div>

          <div className="relative">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-12"
              style={{
                backgroundColor: '#1c1c1c',
                borderColor: '#2a2a2a',
                color: '#f5f5f5',
              }}
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Master Password (min 12 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-12 pr-12"
              style={{
                backgroundColor: '#1c1c1c',
                borderColor: '#2a2a2a',
                color: '#f5f5f5',
              }}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#888888' }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password strength indicator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#2a2a2a' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: password.length >= 12 ? '100%' : `${(password.length / 12) * 100}%`,
                  backgroundColor: password.length >= 12 ? '#4ADE80' : password.length >= 8 ? '#FCD34D' : '#EF4444',
                }}
              />
            </div>
            <span className="text-xs" style={{ color: password.length >= 12 ? '#4ADE80' : '#888888' }}>
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
              className="h-12 pl-12"
              style={{
                backgroundColor: '#1c1c1c',
                borderColor: inviteCode ? '#4ADE80' : '#2a2a2a',
                color: '#f5f5f5',
              }}
            />
            <KeyRound
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: inviteCode ? '#4ADE80' : '#888888' }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#EF4444' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 font-medium"
            style={{ backgroundColor: '#4ADE80', color: '#121212' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#121212]/30 border-t-[#121212] rounded-full animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : inviteCode ? (
              'Create Account (Instant Access)'
            ) : (
              'Request Access'
            )}
          </Button>

          <p className="text-xs text-center" style={{ color: '#666666' }}>
            {inviteCode
              ? 'Valid invite code detected - instant access enabled'
              : 'Without invite code, your account will require admin approval'}
          </p>

          <button
            type="button"
            onClick={() => handleViewChange('login')}
            className="w-full flex items-center justify-center gap-2 text-sm transition-colors hover:text-[#f5f5f5]"
            style={{ color: '#888888' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </form>
      )}

      {/* Signup Pending Approval State */}
      {authView === 'signup' && signupPending && (
        <div className="w-full max-w-sm space-y-4">
          <div
            className="text-center p-6 rounded-xl"
            style={{ backgroundColor: '#1c1c1c', border: '1px solid #4ADE80' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: '#4ADE80' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#f5f5f5' }}>
              Access Request Sent
            </h3>
            <p className="text-sm mb-4" style={{ color: '#888888' }}>
              Your account is pending administrator approval. You will receive an email via Spacemail once your vault is
              ready.
            </p>
            <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#252525', color: '#888888' }}>
              <strong style={{ color: '#f5f5f5' }}>Username:</strong> {username}
              <br />
              <strong style={{ color: '#f5f5f5' }}>Email:</strong> {email}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleViewChange('login')}
            className="w-full flex items-center justify-center gap-2 text-sm transition-colors hover:text-[#f5f5f5]"
            style={{ color: '#888888' }}
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
                  className="h-12 pl-12"
                  style={{
                    backgroundColor: '#1c1c1c',
                    borderColor: '#2a2a2a',
                    color: '#f5f5f5',
                  }}
                  autoFocus
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#EF4444' }}>
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-medium"
                style={{ backgroundColor: '#4ADE80', color: '#121212' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#121212]/30 border-t-[#121212] rounded-full animate-spin" />
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
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#1c1c1c', borderColor: '#2a2a2a' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#4ADE80' }}
              >
                <Mail className="w-8 h-8" style={{ color: '#121212' }} />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: '#f5f5f5' }}>
                Check Your Email
              </h3>
              <p className="text-sm" style={{ color: '#888888' }}>
                We&apos;ve sent a recovery link to <span style={{ color: '#4ADE80' }}>{email}</span>
              </p>
              <p className="text-xs mt-2" style={{ color: '#666666' }}>
                Powered by Spacemail SMTP
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleViewChange('login')}
            className="w-full flex items-center justify-center gap-2 text-sm transition-colors hover:text-[#f5f5f5]"
            style={{ color: '#888888' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="absolute bottom-6 text-xs" style={{ color: '#888888' }}>
        Powered by the MSC Media Engine
      </div>
    </div>
  )
}
