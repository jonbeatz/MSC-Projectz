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

    // Simulate auth delay
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#121212' }}>
      {/* Vader Vault Logo */}
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
            Vader Vault
          </h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            {isFirstTime ? 'Create your master password' : 'Enter your master password'}
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-12"
            style={{
              backgroundColor: '#1c1c1c',
              borderColor: '#2a2a2a',
              color: '#f5f5f5',
            }}
            autoFocus
          />
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
          style={{
            backgroundColor: '#4ADE80',
            color: '#121212',
          }}
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

        {!isFirstTime && (
          <button
            type="button"
            className="w-full text-sm transition-colors hover:text-[#f5f5f5]"
            style={{ color: '#888888' }}
          >
            Forgot Password?
          </button>
        )}
      </form>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs" style={{ color: '#888888' }}>
        Powered by the MSC Media Engine
      </div>
    </div>
  )
}
