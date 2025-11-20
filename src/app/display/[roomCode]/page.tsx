'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { Player } from '@/types/game'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface BuzzedPlayer {
  playerName: string
  playerColor?: string
  position?: number
}

interface RoundResult {
  correct: boolean
  player?: { name: string }
  answer: string
  points?: number
  message?: string
}

export default function DisplayTV() {
  const params = useParams()
  const roomCode = (params.roomCode as string).toUpperCase()
  const { socket } = useSocket()

  const [players, setPlayers] = useState<Player[]>([])
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'buzzed' | 'result'>('waiting')
  const [buzzedPlayer, setBuzzedPlayer] = useState<BuzzedPlayer | null>(null)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timerDuration, setTimerDuration] = useState(10)
  const [gameMode, setGameMode] = useState<string>('accumul_points')
  const [isShaking, setIsShaking] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Confetti animation
  const fireConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)
  }

  // Shake animation
  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 600)
  }

  // Join as display
  useEffect(() => {
    if (!socket || !roomCode) return

    console.log('📺 Display connecting to room:', roomCode)
    socket.emit('join_game', {
      roomCode,
      playerName: `Display-${roomCode}`,
    })
  }, [socket, roomCode])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('player_joined', (data: any) => setPlayers(data.players || []))
    socket.on('player_left', (data: any) => setPlayers(data.players || []))

    socket.on('round_started', (data: any) => {
      // Capture game mode
      if (data.mode) {
        setGameMode(data.mode)
      }
    })

    socket.on('play_track', (data: any) => {
      setGameStatus('playing')
      setBuzzedPlayer(null)
      setResult(null)
      setTimerDuration(data.timerDuration || 10)
      setTimeLeft(data.timerDuration || 10)

      // Play audio
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(data.previewUrl)
      audio.volume = data.volume || 0.7
      audio.play().catch((err) => console.error('Audio error:', err))
      audioRef.current = audio

      // Start timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev === null ? null : prev - 0.1))
      }, 100)
    })

    socket.on('stop_music', () => {
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    })

    socket.on('buzz_locked', (data: BuzzedPlayer) => {
      setBuzzedPlayer(data)
      setGameStatus('buzzed')
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    })

    socket.on('round_result', (data: any) => {
      setResult(data)
      setGameStatus('result')
      setBuzzedPlayer(null)
      setPlayers(data.leaderboard || [])
      setTimeLeft(null)
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Trigger animations based on result
      if (data.correct) {
        fireConfetti()
      } else {
        triggerShake()
      }

      setTimeout(() => {
        setGameStatus('waiting')
        setResult(null)
      }, 5000)
    })

    socket.on('round_skipped' as any, (data: any) => {
      setResult({
        correct: false,
        answer: data.answer,
        message: "Personne n'a trouvé !",
      })
      setGameStatus('result')
      setPlayers(data.leaderboard || [])
      setTimeLeft(null)
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Trigger shake for skipped round
      triggerShake()

      setTimeout(() => {
        setGameStatus('waiting')
        setResult(null)
      }, 5000)
    })

    return () => {
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('play_track')
      socket.off('stop_music')
      socket.off('buzz_locked')
      socket.off('round_result')
      socket.off('round_skipped')
    }
  }, [socket])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-bg-dark via-bg-medium to-bg-dark text-text-primary overflow-hidden transition-transform",
        isShaking && "animate-shake"
      )}
    >
      {/* Header */}
      <header className="bg-bg-card/50 backdrop-blur-md border-b-2 border-primary/20 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-display text-4xl font-bold text-gradient-primary">🎵 BLIND TEST</div>
          <div className="font-mono text-5xl font-bold bg-primary/20 px-8 py-3 rounded-2xl border-4 border-primary">
            {roomCode}
          </div>
          <div className="flex items-center gap-2 text-success">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <span className="font-semibold text-xl">En direct</span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Zone */}
        <div className="flex-1 flex items-center justify-center p-12">
          {/* Waiting State */}
          {gameStatus === 'waiting' && (
            <div className="text-center animate-fade-in">
              <div className="text-9xl mb-8 animate-bounce">🎵</div>
              <h1 className="text-hero font-display font-bold mb-4">En attente...</h1>
              <p className="text-title text-text-secondary">
                {players.length} joueur{players.length > 1 ? 's' : ''} connecté
                {players.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Playing State */}
          {gameStatus === 'playing' && (
            <div className="text-center space-y-12 animate-fade-in relative">
              {/* Ripple Wave Animation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="ripple-wave" />
                <div className="ripple-wave" style={{ animationDelay: '0.5s' }} />
                <div className="ripple-wave" style={{ animationDelay: '1s' }} />
              </div>

              {/* Timer */}
              {timeLeft !== null && (
                <div className="relative z-10">
                  {/* Circular Timer */}
                  <div
                    className={cn(
                      'w-64 h-64 mx-auto rounded-full flex items-center justify-center text-8xl font-display font-bold border-8 transition-colors',
                      timeLeft <= 3 && timeLeft > 0
                        ? 'border-error text-error animate-pulse'
                        : timeLeft <= 0
                        ? 'border-warning text-warning'
                        : 'border-primary text-primary'
                    )}
                  >
                    {timeLeft > 0 ? Math.ceil(timeLeft) : '⏰'}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-96 h-4 bg-bg-card rounded-full overflow-hidden mx-auto mt-8">
                    <div
                      className={cn(
                        'h-full transition-all duration-100',
                        timeLeft <= 3 ? 'bg-error' : 'bg-primary'
                      )}
                      style={{
                        width: `${Math.max(0, (timeLeft / timerDuration) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Audio Visualizer */}
              <div className="flex justify-center gap-2 relative z-10">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 80 + 40}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              <p className="text-2xl text-text-secondary relative z-10">Qui trouvera en premier ?</p>
            </div>
          )}

          {/* Buzzed State */}
          {gameStatus === 'buzzed' && buzzedPlayer && (
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <div
                  className="w-48 h-48 rounded-full mx-auto flex items-center justify-center text-8xl mb-6 animate-bounce"
                  style={{ backgroundColor: buzzedPlayer.playerColor || '#FF3366' }}
                >
                  {gameMode === 'reflexoquiz' && buzzedPlayer.position ? (
                    buzzedPlayer.position === 1 ? '🥇' : buzzedPlayer.position === 2 ? '🥈' : '🥉'
                  ) : (
                    '🎤'
                  )}
                </div>
                <h1 className="text-hero font-display font-bold mb-2">{buzzedPlayer.playerName}</h1>
                <p className="text-title text-text-secondary">
                  {gameMode === 'reflexoquiz' && buzzedPlayer.position ? (
                    buzzedPlayer.position === 1 ? '1er à buzzer !' :
                    buzzedPlayer.position === 2 ? '2e à buzzer !' :
                    '3e à buzzer !'
                  ) : (
                    'a buzzé !'
                  )}
                </p>
                {gameMode === 'reflexoquiz' && buzzedPlayer.position && (
                  <p className="text-2xl text-primary mt-4 font-bold">
                    {buzzedPlayer.position === 1 ? '+15 points' :
                     buzzedPlayer.position === 2 ? '+10 points' :
                     '+5 points'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result State */}
          {gameStatus === 'result' && result && (
            <div
              className={cn(
                'text-center animate-fade-in',
                result.correct ? 'text-success' : 'text-error'
              )}
            >
              <div className="text-9xl mb-6 animate-bounce">
                {result.correct ? '🎉' : result.message ? '😔' : '😢'}
              </div>
              <h1 className="text-hero font-display font-bold mb-6">
                {result.correct ? 'Bravo !' : result.message ? result.message : 'Dommage !'}
              </h1>

              {result.correct && result.player && (
                <div className="text-3xl mb-8">
                  <strong>{result.player.name}</strong> gagne {result.points} points !
                </div>
              )}

              {!result.correct && result.message && (
                <div className="text-3xl mb-8 text-warning">
                  ⏰ Temps écoulé - Aucun joueur n'a buzzé
                </div>
              )}

              <div className="bg-bg-card rounded-3xl p-12 inline-block">
                <div className="text-8xl mb-6">🎵</div>
                <h2 className="text-2xl text-text-secondary mb-4">La réponse était :</h2>
                <p className="text-4xl font-display font-bold">{result.answer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="w-96 bg-bg-card/50 backdrop-blur-md border-l-2 border-primary/20 p-6 overflow-y-auto">
          <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🏆</span>
            <span>Classement</span>
          </h3>
          <Leaderboard players={players} />
        </div>
      </div>
    </div>
  )
}
