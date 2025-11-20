'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function DisplayJoin() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase()

    if (!code) {
      setError('Veuillez entrer un code de salle')
      return
    }

    if (code.length !== 4) {
      setError('Le code doit contenir 4 caractères')
      return
    }

    // Redirect to display page with room code
    router.push(`/display/${code}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-8xl mb-6">📺</div>
          <h1 className="text-hero font-display font-bold mb-4">
            <span className="text-gradient-primary">Affichage TV</span>
          </h1>
          <p className="text-title text-text-secondary mb-2">
            Connecter l'écran de diffusion
          </p>
          <p className="text-text-secondary text-sm">
            Entrez le code de la partie pour afficher le jeu en grand écran
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20 mb-8">
          <h2 className="font-display text-xl font-semibold mb-6 text-center">
            Code de la partie
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase())
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin()
              }}
              maxLength={4}
              className="w-full bg-bg-dark text-text-primary px-6 py-4 rounded-2xl border-2 border-primary/30 focus:border-primary focus:outline-none text-center text-4xl font-display font-bold tracking-widest uppercase"
            />

            {error && (
              <div className="text-error text-center text-sm animate-fade-in">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="xl"
              onClick={handleJoin}
              disabled={!roomCode}
              className="w-full"
            >
              Connecter l'affichage →
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20">
          <h3 className="font-display text-lg font-semibold mb-4 text-center">
            📋 Instructions
          </h3>
          <ol className="space-y-3 text-text-secondary text-sm">
            <li className="flex items-start">
              <span className="font-bold text-primary mr-3">1.</span>
              <span>Connectez ce device à un grand écran (TV, projecteur, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-3">2.</span>
              <span>Demandez le code de salle à l'hôte de la partie</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-3">3.</span>
              <span>Entrez le code ci-dessus (4 caractères)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-3">4.</span>
              <span>L'écran affichera automatiquement la partie en temps réel</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-3">5.</span>
              <span>Mettez en plein écran (F11) pour une meilleure expérience</span>
            </li>
          </ol>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-card rounded-2xl p-4 border border-primary/10 text-center">
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-sm font-semibold mb-1">Musique</div>
            <div className="text-xs text-text-secondary">Affichage synchronisé</div>
          </div>
          <div className="bg-bg-card rounded-2xl p-4 border border-primary/10 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-sm font-semibold mb-1">Classement</div>
            <div className="text-xs text-text-secondary">Temps réel</div>
          </div>
          <div className="bg-bg-card rounded-2xl p-4 border border-primary/10 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-sm font-semibold mb-1">Buzzers</div>
            <div className="text-xs text-text-secondary">Animations live</div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => router.push('/')}
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  )
}
