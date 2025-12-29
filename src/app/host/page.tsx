'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ModeCard } from '@/components/modes/ModeCard'
import { Button } from '@/components/ui/Button'
import { GAME_MODES } from '@/lib/constants'
import { GameMode, PlayMode, DEFAULT_SCORING, ScoringConfig } from '@/types/game'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'
import { isHostAuthenticated } from '@/lib/auth'

export default function HostModSelection() {
  const router = useRouter()
  const { socket, isConnected, error } = useSocket()
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [playMode, setPlayMode] = useState<PlayMode>('solo')
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [numberOfRounds, setNumberOfRounds] = useState(10)
  const [randomStart, setRandomStart] = useState(true)
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(DEFAULT_SCORING)

  // Check authentication on mount
  useEffect(() => {
    if (!isHostAuthenticated()) {
      router.push('/host/login')
    }
  }, [router])

  const handleCreateGame = async () => {
    if (!selectedMode || !socket) {
      setCreateError('Veuillez sélectionner un mode et vérifier la connexion')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      // Emit create_game event and wait for response
      socket.emit('create_game', {
        mode: selectedMode,
        playMode,
        config: {
          numberOfRounds,
          randomStart,
          numberOfTeams: playMode === 'team' ? numberOfTeams : undefined
        },
        scoringConfig
      })

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
            playMode,
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

        {/* Play Mode Selection: Solo vs Team */}
        <div className="mb-12 max-w-2xl mx-auto animate-fade-in">
          <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20">
            <h3 className="font-display text-xl font-semibold mb-6 text-center">
              👥 Type de partie
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Solo Mode Button */}
              <button
                onClick={() => setPlayMode('solo')}
                className={cn(
                  'p-6 rounded-2xl border-2 transition-all duration-200',
                  playMode === 'solo'
                    ? 'bg-primary/10 border-primary shadow-lg scale-105'
                    : 'bg-bg-dark border-border hover:border-primary/50'
                )}
              >
                <div className="text-4xl mb-3">🎮</div>
                <h4 className="font-bold text-lg mb-2">Solo</h4>
                <p className="text-sm text-text-secondary">
                  Chaque joueur pour soi
                </p>
              </button>

              {/* Team Mode Button */}
              <button
                onClick={() => setPlayMode('team')}
                className={cn(
                  'p-6 rounded-2xl border-2 transition-all duration-200',
                  playMode === 'team'
                    ? 'bg-primary/10 border-primary shadow-lg scale-105'
                    : 'bg-bg-dark border-border hover:border-primary/50'
                )}
              >
                <div className="text-4xl mb-3">👥</div>
                <h4 className="font-bold text-lg mb-2">Équipes</h4>
                <p className="text-sm text-text-secondary">
                  Jouez en équipe
                </p>
              </button>
            </div>

            {/* Number of Teams Selector (only for team mode) */}
            {playMode === 'team' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="teams" className="font-semibold text-text-primary">
                    Nombre d'équipes
                  </label>
                  <span className="text-2xl font-bold text-primary">{numberOfTeams}</span>
                </div>
                <input
                  type="range"
                  id="teams"
                  min="2"
                  max="6"
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(Number(e.target.value))}
                  className="w-full h-2 bg-bg-dark rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>2 équipes</span>
                  <span>6 équipes</span>
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Game Configuration */}
        {selectedMode && (
          <div className="mb-12 max-w-2xl mx-auto animate-fade-in">
            <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20">
              <h3 className="font-display text-xl font-semibold mb-6 text-center">
                ⚙️ Configuration de la partie
              </h3>

              {/* Number of Rounds Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="rounds" className="font-semibold text-text-primary">
                    Nombre de manches
                  </label>
                  <span className="text-2xl font-bold text-primary">{numberOfRounds}</span>
                </div>
                <input
                  type="range"
                  id="rounds"
                  min="5"
                  max="20"
                  value={numberOfRounds}
                  onChange={(e) => setNumberOfRounds(Number(e.target.value))}
                  className="w-full h-2 bg-bg-dark rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>5 manches</span>
                  <span>20 manches</span>
                </div>
              </div>

              {/* Random Start Toggle */}
              <div className="flex items-center justify-between p-4 bg-bg-dark rounded-xl mb-6">
                <div>
                  <p className="font-semibold text-text-primary mb-1">
                    🎲 Démarrage aléatoire
                  </p>
                  <p className="text-sm text-text-secondary">
                    Les morceaux démarrent à un moment aléatoire (10-70%)
                  </p>
                </div>
                <button
                  onClick={() => setRandomStart(!randomStart)}
                  className={cn(
                    'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
                    randomStart ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                      randomStart ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Scoring Configuration */}
              <div className="p-6 bg-bg-dark rounded-xl border-2 border-primary/20">
                <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  🎯 Configuration du système de points
                </h4>

                {/* Points for Full Correct */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">
                      Artiste + Titre corrects
                    </label>
                    <span className="text-xl font-bold text-success">
                      +{scoringConfig.pointsFullCorrect}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={scoringConfig.pointsFullCorrect}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        pointsFullCorrect: Number(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-bg-medium rounded-lg appearance-none cursor-pointer accent-success"
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>1 pt</span>
                    <span>20 pts</span>
                  </div>
                </div>

                {/* Points for Partial Correct */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">
                      1 bonne réponse sur 2 (artiste OU titre)
                    </label>
                    <span className="text-xl font-bold text-warning">
                      +{scoringConfig.pointsPartialCorrect}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={scoringConfig.pointsPartialCorrect}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        pointsPartialCorrect: Number(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-bg-medium rounded-lg appearance-none cursor-pointer accent-warning"
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>0 pt</span>
                    <span>15 pts</span>
                  </div>
                </div>

                {/* Penalty for Both Wrong */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">
                      Les 2 réponses fausses (pénalité)
                    </label>
                    <span className="text-xl font-bold text-error">
                      {scoringConfig.pointsBothWrong}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="0"
                    value={scoringConfig.pointsBothWrong}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        pointsBothWrong: Number(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-bg-medium rounded-lg appearance-none cursor-pointer accent-error"
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>-10 pts</span>
                    <span>0 pt</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-bg-medium rounded-lg">
                  <p className="text-xs text-text-secondary">
                    💡 <strong>Astuce :</strong> Ces points s'appliquent lors de la validation des réponses par l'hôte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
