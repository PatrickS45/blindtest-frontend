'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function PlayerJoin() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')

  const handleJoin = () => {
    if (roomCode.length === 4 && playerName.trim()) {
      // Save player name for later
      localStorage.setItem('blindtest_player_name', playerName)

      // Navigate to player page with room code
      router.push(`/player/${roomCode.toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary p-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-hero font-display font-bold mb-2 text-gradient-primary">
            Rejoindre
          </h1>
          <p className="text-text-secondary">
            Entrez le code de la partie
          </p>
        </div>

        {/* Form */}
        <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20 space-y-6">
          {/* Room Code Input */}
          <div>
            <label className="block text-text-secondary mb-3 font-semibold">
              Code de la salle
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              className="w-full bg-bg-dark text-text-primary px-6 py-4 rounded-2xl border-2 border-primary/30 focus:border-primary text-center text-3xl font-mono font-bold tracking-widest uppercase focus:outline-none transition-colors"
            />
          </div>

          {/* Player Name Input */}
          <div>
            <label className="block text-text-secondary mb-3 font-semibold">
              Votre pseudo
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Joueur 1"
              maxLength={20}
              className="w-full bg-bg-dark text-text-primary px-6 py-4 rounded-2xl border-2 border-primary/30 focus:border-primary text-center text-xl font-display focus:outline-none transition-colors"
            />
          </div>

          {/* Join Button */}
          <Button
            variant="primary"
            size="large"
            disabled={roomCode.length !== 4 || !playerName.trim()}
            onClick={handleJoin}
            className="w-full"
          >
            Rejoindre la partie →
          </Button>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="ghost"
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
