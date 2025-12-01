'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { verifyHostAccessCode } from '@/lib/auth'
import { Button } from '@/components/ui/Button'

export default function HostLogin() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsVerifying(true)

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (verifyHostAccessCode(accessCode)) {
      // Redirect to host mode selection
      router.push('/host')
    } else {
      setError('Code d\'accès incorrect')
      setAccessCode('')
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-hero font-display font-bold mb-4">
            <span className="text-gradient-primary">🔒 Accès Host</span>
          </h1>
          <p className="text-text-secondary">
            Entrez le code d'accès pour créer une partie
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code Input */}
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-semibold text-text-primary mb-2"
              >
                Code d'accès
              </label>
              <input
                type="password"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Entrez votre code secret"
                className="w-full px-4 py-3 bg-bg-dark border-2 border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
                autoComplete="off"
                autoFocus
                disabled={isVerifying}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-error/10 border-2 border-error animate-shake">
                <p className="text-error text-sm font-semibold text-center">
                  ❌ {error}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="large"
                onClick={() => router.push('/')}
                disabled={isVerifying}
                className="flex-1"
              >
                ← Retour
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={!accessCode.trim() || isVerifying}
                loading={isVerifying}
                className="flex-1"
              >
                {isVerifying ? 'Vérification...' : 'Accéder →'}
              </Button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-text-secondary text-sm animate-fade-in">
          <p>
            🛡️ Seuls les organisateurs autorisés peuvent créer des parties
          </p>
        </div>
      </div>
    </div>
  )
}
