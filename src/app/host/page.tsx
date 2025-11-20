'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModeCard } from '@/components/modes/ModeCard'
import { Button } from '@/components/ui/Button'
import { GAME_MODES } from '@/lib/constants'
import { GameMode } from '@/types/game'
import { useSocket } from '@/hooks/useSocket'

export default function HostModSelection() {
  const router = useRouter()
  const { socket, isConnected, error } = useSocket()
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateGame = async () => {
    if (!selectedMode || !socket) {
      setCreateError('Veuillez sélectionner un mode et vérifier la connexion')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      // Emit create_game event and wait for response
      socket.emit('create_game', { mode: selectedMode })

      // Listen for game creation response
      socket.once('game_created', (data) => {
        console.log('Game created:', data)
        const { roomCode } = data

        // Save game info to localStorage for potential reconnection
        localStorage.setItem(
          'blindtest_game_state',
          JSON.stringify({
            roomCode,
            mode: selectedMode,
            role: 'host',
            timestamp: new Date().toISOString(),
          })
        )

        // Navigate to host control page
        router.push(`/host/control/${roomCode}`)
      })

      // Handle errors
      socket.once('error', (errorData) => {
        console.error('Game creation error:', errorData)
        setCreateError(errorData.message || 'Erreur lors de la création de la partie')
        setIsCreating(false)
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (isCreating) {
          setCreateError('Délai d\'attente dépassé. Veuillez réessayer.')
          setIsCreating(false)
        }
      }, 10000)
    } catch (err) {
      console.error('Failed to create game:', err)
      setCreateError('Erreur de connexion au serveur')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-hero font-display font-bold mb-4">
            <span className="text-gradient-primary">🎵 Blind Test</span>
          </h1>
          <p className="text-title text-text-secondary mb-2">
            Choisissez votre mode de jeu
          </p>
          <p className="text-text-secondary text-sm">
            6 modes différents pour des parties inoubliables !
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-8 p-4 rounded-2xl bg-warning/10 border-2 border-warning text-center">
            <p className="text-warning font-semibold">
              ⚠️ Connexion au serveur en cours...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-error/10 border-2 border-error text-center">
            <p className="text-error font-semibold">❌ {error}</p>
          </div>
        )}

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {GAME_MODES.map((mode) => (
            <ModeCard
              key={mode.id}
              {...mode}
              selected={selectedMode === mode.id}
              onClick={() => setSelectedMode(mode.id)}
            />
          ))}
        </div>

        {/* Create Game Button */}
        <div className="text-center space-y-4">
          {createError && (
            <div className="p-4 rounded-2xl bg-error/10 border-2 border-error inline-block">
              <p className="text-error font-semibold">{createError}</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              size="large"
              onClick={() => router.push('/')}
            >
              ← Retour
            </Button>

            <Button
              variant="primary"
              size="xl"
              disabled={!selectedMode || !isConnected || isCreating}
              loading={isCreating}
              onClick={handleCreateGame}
              className="min-w-[300px]"
            >
              {isCreating ? 'Création...' : 'Créer la partie →'}
            </Button>
          </div>

          {selectedMode && (
            <p className="text-text-secondary text-sm animate-fade-in">
              Mode sélectionné :{' '}
              <span className="font-semibold text-primary">
                {GAME_MODES.find((m) => m.id === selectedMode)?.name}
              </span>
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20">
            <h3 className="font-display text-xl font-semibold mb-4 text-center">
              📋 Comment ça marche ?
            </h3>
            <ol className="space-y-3 text-text-secondary">
              <li className="flex items-start">
                <span className="font-bold text-primary mr-3">1.</span>
                <span>Sélectionnez un mode de jeu parmi les 6 disponibles</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-primary mr-3">2.</span>
                <span>Cliquez sur "Créer la partie" pour générer un code de salle</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-primary mr-3">3.</span>
                <span>Partagez le code avec vos joueurs (QR code disponible)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-primary mr-3">4.</span>
                <span>Chargez une playlist R2 et lancez la partie !</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
