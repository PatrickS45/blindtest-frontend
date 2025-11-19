'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(2)

  useEffect(() => {
    // Check if authentication was successful
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (error) {
      // Handle error case
      setTimeout(() => {
        router.push('/host')
      }, 3000)
      return
    }

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Redirect to host page or back to where they came from
          const returnUrl = sessionStorage.getItem('spotify_auth_return_url') || '/host'
          sessionStorage.removeItem('spotify_auth_return_url')
          router.push(returnUrl)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router, searchParams])

  const error = searchParams.get('error')

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-8xl mb-6">❌</div>
          <h1 className="text-hero font-display font-bold mb-4">Erreur d'authentification</h1>
          <p className="text-text-secondary text-xl">
            Une erreur s'est produite lors de la connexion à Spotify
          </p>
          <p className="text-sm text-text-secondary">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl mb-6 animate-bounce">✓</div>
        <h1 className="text-hero font-display font-bold mb-4 text-gradient-primary">
          Authentification réussie !
        </h1>
        <p className="text-text-secondary text-xl">
          Vous êtes maintenant connecté à Spotify
        </p>

        {/* Countdown */}
        <div className="bg-bg-card rounded-3xl p-8 border-2 border-success">
          <div className="text-6xl font-display font-bold text-success mb-2">{countdown}</div>
          <p className="text-text-secondary">Redirection en cours...</p>
        </div>

        {/* Success checkmarks animation */}
        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-success rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AuthSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl mb-6">🎵</div>
          <p className="text-text-secondary text-xl">Chargement...</p>
        </div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  )
}
