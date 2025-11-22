'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { useSoundEffect } from '@/hooks/useAudio'
import { Buzzer } from '@/components/game/Buzzer'
import { cn } from '@/lib/utils'

// Helper to get position badge for Reflexoquiz mode
function getPositionBadge(position: number | null) {
  if (!position) return null
  const badges: Record<number, { emoji: string; label: string; points: string; color: string }> = {
    1: { emoji: '🥇', label: '1er', points: '+15 pts', color: 'text-yellow-400' },
    2: { emoji: '🥈', label: '2e', points: '+10 pts', color: 'text-gray-300' },
    3: { emoji: '🥉', label: '3e', points: '+5 pts', color: 'text-orange-400' },
  }
  return badges[position] || null
}

export default function Player() {
  const params = useParams()
  const router = useRouter()
  const roomCode = (params.roomCode as string).toUpperCase()
  const { socket } = useSocket()
  const { playCorrect, playWrong, playTimeout } = useSoundEffect()

  const [playerName, setPlayerName] = useState('')
  const [joined, setJoined] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'locked'>('waiting')
  const [canBuzz, setCanBuzz] = useState(false)
  const [buzzedPlayer, setBuzzedPlayer] = useState('')
  const [myScore, setMyScore] = useState(0)
  const [myBuzzerSound, setMyBuzzerSound] = useState<number | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [answerTimer, setAnswerTimer] = useState(0)
  const [lastResult, setLastResult] = useState<any>(null)
  const [gameMode, setGameMode] = useState<string>('accumul_points')
  const [myBuzzPosition, setMyBuzzPosition] = useState<number | null>(null)

  const myBuzzerSoundRef = useRef<number | null>(null)

  // Get player name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('blindtest_player_name')
    if (savedName) {
      setPlayerName(savedName)
    }
  }, [])

  // Answer timer countdown
  useEffect(() => {
    if (answerTimer > 0) {
      const interval = setInterval(() => {
        setAnswerTimer((prev) => (prev <= 1 ? 0 : prev - 1))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [answerTimer])

  // Join game
  const handleJoin = () => {
    if (!socket || !roomCode || !playerName) {
      alert('Veuillez renseigner votre pseudo')
      return
    }

    console.log('👤 Joining game:', roomCode, playerName)
    socket.emit('join_game', { roomCode, playerName })

    // Mark as joined immediately (server will confirm with events)
    setJoined(true)

    // Generate a random buzzer sound (1-23)
    const buzzerSound = Math.floor(Math.random() * 23) + 1
    setMyBuzzerSound(buzzerSound)
    myBuzzerSoundRef.current = buzzerSound

    // Save player name
    localStorage.setItem('blindtest_player_name', playerName)
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket || !joined) return

    socket.on('round_started', (data: any) => {
      console.log('🎵 Round started', data)
      setGameStatus('playing')
      setCanBuzz(true)
      setLastResult(null)
      setBuzzedPlayer('')
      setAnswerTimer(0)
      setRoundNumber((prev) => prev + 1)
      setMyBuzzPosition(null)

      // Capture game mode
      if (data.mode) {
        setGameMode(data.mode)
      }
    })

    socket.on('player_joined', (data: any) => {
      console.log('👥 Player joined, updating players list')
      // Initialize my score from the players list
      const myPlayer = data.players?.find((p: any) => p.name === playerName)
      if (myPlayer) {
        setMyScore(myPlayer.score || 0)
      }
    })

    socket.on('buzz_locked', (data: any) => {
      console.log('⚡ Buzz locked:', data.playerName, 'position:', data.position)
      setCanBuzz(false)
      setBuzzedPlayer(data.playerName)
      setGameStatus('locked')
      setAnswerTimer(8)

      // Store buzz position for reflexoquiz mode
      if (data.playerName === playerName && data.position) {
        setMyBuzzPosition(data.position)
      }
    })

    socket.on('timeout_warning', (data: any) => {
      console.log('⚠️ 4 seconds left')
      playTimeout()
    })

    socket.on('round_result', (data: any) => {
      console.log('📊 Round result:', data)
      setLastResult(data)
      setGameStatus('waiting')
      setBuzzedPlayer('')
      setAnswerTimer(0)

      // Play feedback sound if I was the one who answered
      if (data.playerName === playerName) {
        data.isCorrect ? playCorrect() : playWrong()
      }

      // Update my score
      const myPlayer = data.leaderboard?.find((p: any) => p.name === playerName)
      if (myPlayer) {
        setMyScore(myPlayer.score)
      }
    })

    socket.on('wrong_answer_continue', (data: any) => {
      console.log('❌ Wrong answer, game continues')

      // Play wrong sound if it was me
      if (data.playerName === playerName) {
        playWrong()
      }

      // Re-enable buzzer
      setGameStatus('playing')
      setCanBuzz(true)
      setBuzzedPlayer('')
      setAnswerTimer(0)

      // Update my score from leaderboard
      const myPlayer = data.leaderboard?.find((p: any) => p.name === playerName)
      if (myPlayer) {
        setMyScore(myPlayer.score)
      }
    })

    socket.on('timeout_continue', (data: any) => {
      console.log('⏱️ Timeout, game continues')

      // Play timeout sound if it was me
      if (data.playerName === playerName) {
        playTimeout()
      }

      // Re-enable buzzer
      setGameStatus('playing')
      setCanBuzz(true)
      setBuzzedPlayer('')
      setAnswerTimer(0)

      // Update my score if it was me
      if (data.playerName === playerName) {
        setMyScore((prev) => prev + data.points)
      }
    })

    socket.on('game_ended', () => {
      console.log('🏁 Game ended')
      router.push('/')
    })

    return () => {
      socket.off('round_started')
      socket.off('player_joined')
      socket.off('buzz_locked')
      socket.off('timeout_warning')
      socket.off('round_result')
      socket.off('wrong_answer_continue')
      socket.off('timeout_continue')
      socket.off('game_ended')
    }
  }, [socket, joined, playerName, playCorrect, playWrong, playTimeout, router])

  const handleBuzz = () => {
    if (!socket) return
    socket.emit('buzz', { roomCode })
  }

  // Join screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary p-6 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-hero font-display font-bold mb-2 text-gradient-primary">
              Rejoindre
            </h1>
            <p className="text-text-secondary">Code : {roomCode}</p>
          </div>

          <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20">
            <label className="block text-text-secondary mb-3 font-semibold">
              Votre pseudo
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Joueur 1"
              maxLength={20}
              className="w-full bg-bg-dark text-text-primary px-6 py-4 rounded-2xl border-2 border-primary/30 focus:border-primary text-center text-xl font-display focus:outline-none transition-colors mb-6"
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              autoFocus
            />

            <button
              onClick={handleJoin}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-br from-primary to-primary-dark text-white py-4 rounded-2xl font-display font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
            >
              Rejoindre →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex flex-col">
      {/* Header - Score */}
      <div className="p-6 bg-bg-card border-b-2 border-primary/20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-text-secondary text-sm">Votre score</div>
            <div className="font-display text-4xl font-bold text-primary">{myScore}</div>
          </div>
          <div className="text-center">
            <div className="text-text-secondary text-sm">Manche</div>
            <div className="font-display text-3xl font-bold">{roundNumber}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-semibold">{playerName}</div>
            <div className="text-text-secondary text-sm">{roomCode}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Buzzer */}
        <Buzzer
          onClick={handleBuzz}
          disabled={!canBuzz}
          buzzerSound={myBuzzerSound || undefined}
          size="xl"
        />

        {/* Player Name */}
        <div className="font-display text-2xl">{playerName}</div>

        {/* Status Messages */}
        {gameStatus === 'waiting' && (
          <div className="text-center text-text-secondary">
            <p className="text-xl">⏳ En attente de la prochaine manche...</p>
            {lastResult && (
              <div className={cn('mt-4 p-6 rounded-2xl', lastResult.isCorrect ? 'bg-success/20' : 'bg-error/20')}>
                <p className={cn('font-semibold text-xl', lastResult.isCorrect ? 'text-success' : 'text-error')}>
                  {lastResult.isCorrect ? '✓ Bonne réponse !' : '✗ Mauvaise réponse'}
                </p>

                {/* Show position and points for Reflexoquiz mode */}
                {gameMode === 'reflexoquiz' && lastResult.playerName === playerName && lastResult.buzzPosition && (
                  <div className="mt-3">
                    {(() => {
                      const badge = getPositionBadge(lastResult.buzzPosition)
                      return badge ? (
                        <div className={cn('text-3xl font-display', badge.color)}>
                          {badge.emoji} {badge.label} - {lastResult.pointsAwarded > 0 ? '+' : ''}{lastResult.pointsAwarded} points
                        </div>
                      ) : null
                    })()}
                  </div>
                )}

                {/* Show points for other modes */}
                {gameMode !== 'reflexoquiz' && lastResult.playerName === playerName && lastResult.pointsAwarded !== undefined && (
                  <p className="mt-2 text-text-secondary">
                    {lastResult.pointsAwarded > 0 ? '+' : ''}{lastResult.pointsAwarded} points
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {gameStatus === 'playing' && (
          <div className="text-center">
            <p className="text-2xl font-semibold text-primary animate-pulse">🎵 À vous de jouer !</p>
            <p className="text-text-secondary mt-2">Appuyez sur le buzzer quand vous savez</p>
          </div>
        )}

        {gameStatus === 'locked' && buzzedPlayer && (
          <div className="text-center space-y-4">
            {buzzedPlayer === playerName ? (
              <>
                <p className="text-3xl font-display font-bold text-primary">⚡ Vous avez buzzé !</p>

                {/* Show position badge for Reflexoquiz mode */}
                {gameMode === 'reflexoquiz' && myBuzzPosition && (
                  <div className="animate-bounce">
                    {(() => {
                      const badge = getPositionBadge(myBuzzPosition)
                      return badge ? (
                        <div className={cn('text-5xl font-display font-bold', badge.color)}>
                          {badge.emoji} {badge.label} - {badge.points}
                        </div>
                      ) : null
                    })()}
                  </div>
                )}

                <p className="text-text-secondary">Donnez votre réponse au MC</p>
                {answerTimer > 0 && (
                  <div className="relative">
                    <div
                      className={cn(
                        'w-32 h-32 rounded-full mx-auto flex items-center justify-center text-5xl font-display font-bold border-8 transition-colors',
                        answerTimer <= 3 ? 'border-error text-error animate-pulse' : 'border-primary text-primary'
                      )}
                    >
                      {answerTimer}
                    </div>
                    <p className="mt-4 text-text-secondary">Secondes restantes</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-display font-semibold">{buzzedPlayer} a buzzé !</p>
                <p className="text-text-secondary">⏳ En attente de validation...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
