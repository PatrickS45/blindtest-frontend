'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function DisplayTV() {
  const params = useParams()
  const roomCode = params.roomCode as string

  useEffect(() => {
    // Redirect to old display page for now
    window.location.href = `/display?roomCode=${roomCode}`
  }, [roomCode])

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">📺</div>
        <p className="text-xl">Redirection vers l'affichage TV...</p>
        <p className="text-text-secondary mt-2">Code : {roomCode.toUpperCase()}</p>
      </div>
    </div>
  )
}
