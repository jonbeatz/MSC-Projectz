'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
export function LoginScreen() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login, masterPassword } = useAppStore()
  const isFirstTime = !masterPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 500))

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

    const success = login(password)
    if (!success) {
      setError('Invalid master password')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-card">
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
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center bg-primary">
            <Lock className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vader Vault</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {isFirstTime ? 'Create your master password' : 'Enter your master password'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
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

        <Button type="submit" className="w-full h-12 font-medium bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Authenticating...</span>
            </div>
          ) : isFirstTime ? (
            'Create Vault'
          ) : (
            'Unlock Vault'
          )}
        </Button>

        {!isFirstTime && (
          <button
            type="button"
            className="w-full text-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            Forgot Password?
          </button>
        )}
      </form>

      <div className="absolute bottom-6 text-xs text-muted-foreground">Powered by the MSC Media Engine</div>
    </div>
  )
}
