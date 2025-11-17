'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Player() {
  const params = useParams()
  const roomCode = params.roomCode as string

  useEffect(() => {
    // Get saved player name
    const playerName = localStorage.getItem('blindtest_player_name') || 'Joueur'

    // Redirect to old player page for now
    window.location.href = `/player?roomCode=${roomCode}&playerName=${encodeURIComponent(
      playerName
    )}`
  }, [roomCode])

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🎮</div>
        <p className="text-xl">Connexion à la partie...</p>
        <p className="text-text-secondary mt-2">Code : {roomCode.toUpperCase()}</p>
      </div>
    </div>
  )
}
