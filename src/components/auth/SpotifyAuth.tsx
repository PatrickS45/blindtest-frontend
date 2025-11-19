'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

const API_BASE_URL = 'https://blindtest-backend-cfbp.onrender.com'

interface SpotifyAuthProps {
  onAuthSuccess?: () => void
  compact?: boolean
}

export function SpotifyAuth({ onAuthSuccess, compact = false }: SpotifyAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
        credentials: 'include',
      })
      const data = await response.json()
      setIsAuthenticated(data.authenticated)

      if (data.authenticated && onAuthSuccess) {
        onAuthSuccess()
      }
    } catch (err) {
      console.error('Error checking auth status:', err)
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/spotify`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.authUrl) {
        // Redirect to Spotify OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error('Auth URL not received')
      }
    } catch (err) {
      console.error('Error initiating Spotify auth:', err)
      setError('Impossible de se connecter à Spotify')
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setIsAuthenticated(false)
    } catch (err) {
      console.error('Error disconnecting:', err)
      setError('Erreur lors de la déconnexion')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-text-secondary">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Vérification...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error/10 border-2 border-error rounded-2xl p-4">
        <p className="text-error text-sm">{error}</p>
        <Button variant="secondary" size="small" onClick={checkAuthStatus} className="mt-2">
          Réessayer
        </Button>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className={compact ? 'flex items-center gap-3' : 'bg-success/10 border-2 border-success rounded-2xl p-4'}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span className={compact ? 'text-sm text-success' : 'text-success font-semibold'}>
            ✓ Connecté à Spotify
          </span>
        </div>
        {!compact && (
          <Button variant="secondary" size="small" onClick={handleDisconnect} className="mt-3">
            Se déconnecter
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'bg-bg-card rounded-2xl p-4 border-2 border-primary/20'}>
      <div className={compact ? '' : 'mb-3'}>
        <p className="text-text-secondary text-sm">
          {compact ? '🔒 Auth requise' : '🔒 Connectez-vous à Spotify pour accéder à toutes les playlists'}
        </p>
      </div>
      <Button
        variant="primary"
        size={compact ? 'medium' : 'large'}
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full bg-[#1DB954] hover:bg-[#1ed760] border-none"
      >
        <span className="flex items-center justify-center gap-2">
          🎵 Se connecter avec Spotify
        </span>
      </Button>
    </div>
  )
}
