'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { Player } from '@/types/game'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { QRCodeCanvas } from 'qrcode.react'

interface BuzzedPlayer {
  playerName: string
  playerColor?: string
  position?: number
}

interface RoundResult {
  isCorrect?: boolean
  correct?: boolean  // Support backend format
  playerName?: string
  player?: { name: string }  // Support backend format
  correctAnswer?: string
  answer?: string  // Support backend format
  pointsAwarded?: number
  points?: number  // Support backend format
  message?: string
}

export default function DisplayTV() {
  const params = useParams()
  const roomCode = (params.roomCode as string).toUpperCase()
  const { socket } = useSocket()

  const [players, setPlayers] = useState<Player[]>([])
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'buzzed' | 'result' | 'finished'>('waiting')
  const [buzzedPlayer, setBuzzedPlayer] = useState<BuzzedPlayer | null>(null)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timerDuration, setTimerDuration] = useState(10)
  const [gameMode, setGameMode] = useState<string>('accumul_points')
  const [bombHolder, setBombHolder] = useState<string | null>(null)
  const [hints, setHints] = useState<string[]>([])
  const [currentHintIndex, setCurrentHintIndex] = useState(-1)
  const [isShaking, setIsShaking] = useState(false)
  const [finalResults, setFinalResults] = useState<{ leaderboard: Player[]; totalRounds: number } | null>(null)

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

    // Log ALL incoming events for debugging
    const originalOn = socket.on.bind(socket)
    const originalEmit = socket.emit.bind(socket)

    socket.onAny((eventName: string, ...args: any[]) => {
      console.log(`🔔 [Socket Event] ${eventName}:`, JSON.stringify(args, null, 2))
    })

    socket.on('player_joined', (data: any) => setPlayers(data.players || []))
    socket.on('player_left', (data: any) => setPlayers(data.players || []))

    socket.on('round_started', (data: any) => {
      // Capture game mode
      if (data.mode) {
        setGameMode(data.mode)
      }
      // Reset bomb holder
      setBombHolder(null)
      // Initialize hints for questions_rafale mode
      if (data.hints) {
        setHints(data.hints)
        setCurrentHintIndex(-1)
      } else {
        setHints([])
        setCurrentHintIndex(-1)
      }
    })

    socket.on('play_track', (data: any) => {
      console.log('🎵 [PLAY_TRACK] Track data:', {
        previewUrl: data.previewUrl,
        startTime: data.startTime,
        timerDuration: data.timerDuration
      })

      setGameStatus('playing')
      setBuzzedPlayer(null)
      setResult(null)
      setTimerDuration(data.timerDuration || 10)
      setTimeLeft(data.timerDuration || 10)

      // Play audio
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(data.previewUrl)
      audio.volume = data.volume || 0.7

      // If startTime is provided (random start), seek to that position
      if (data.startTime && data.startTime > 0) {
        audio.addEventListener('loadedmetadata', () => {
          audio.currentTime = data.startTime
          console.log('🎲 [PLAY_TRACK] Audio starting at', data.startTime, 'seconds (random start)')
        }, { once: true })
      } else {
        console.log('▶️ [PLAY_TRACK] Audio starting from beginning')
      }

      audio.play().catch((err) => console.error('❌ Audio error:', err))
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

    socket.on('resume_audio', () => {
      console.log('▶️ [RESUME_AUDIO] Resuming music playback')
      if (audioRef.current) {
        audioRef.current.play().catch((err) => console.error('❌ Resume audio error:', err))
      }
      // Restart timer if it was paused
      if (timeLeft !== null && timeLeft > 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => (prev === null ? null : prev - 0.1))
        }, 100)
      }
    })

    socket.on('wrong_answer_continue', (data: any) => {
      console.log('❌ [WRONG_ANSWER_CONTINUE] Wrong answer - player will continue', JSON.stringify(data, null, 2))

      // Show wrong answer feedback briefly
      setResult({
        isCorrect: false,
        correct: false,
        playerName: buzzedPlayer?.playerName,
        message: 'Mauvaise réponse !',
      })
      setGameStatus('result')

      // Trigger shake and wrong sound
      triggerShake()
      try {
        const wrongSound = new Audio('/sounds/wrong_1.mp3')
        wrongSound.volume = 0.5
        wrongSound.play().catch(err => console.error('❌ Wrong sound error:', err))
      } catch (err) {
        console.error('❌ Failed to create wrong sound:', err)
      }

      // After 2 seconds, go back to playing state
      setTimeout(() => {
        setGameStatus('playing')
        setResult(null)
        setBuzzedPlayer(null)
      }, 2000)
    })

    socket.on('round_result', (data: any) => {
      console.log('📊 [ROUND_RESULT HANDLER] Entering round_result handler')
      console.log('📊 [ROUND_RESULT HANDLER] Raw data:', JSON.stringify(data, null, 2))
      console.log('📊 [ROUND_RESULT HANDLER] Data keys:', Object.keys(data))

      // Check for correct answer (support both formats)
      const isCorrect = data.isCorrect ?? data.correct ?? false
      console.log('🔍 [ROUND_RESULT HANDLER] isCorrect value:', isCorrect, '(from data.isCorrect:', data.isCorrect, 'or data.correct:', data.correct, ')')
      console.log('🔍 [ROUND_RESULT HANDLER] Player:', data.playerName || data.player?.name || 'NONE')
      console.log('🔍 [ROUND_RESULT HANDLER] Points:', data.pointsAwarded || data.points || 'NONE')
      console.log('🔍 [ROUND_RESULT HANDLER] Answer:', data.correctAnswer || data.answer || 'NONE')

      setResult(data)
      setGameStatus('result')
      setBuzzedPlayer(null)
      setPlayers(data.leaderboard || [])
      setTimeLeft(null)
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Trigger animations and sound effects based on result
      if (isCorrect) {
        console.log('✅ Correct answer - playing confetti and sound')
        fireConfetti()
        // Play correct sound
        try {
          const correctSound = new Audio('/sounds/correct_1.mp3')
          correctSound.volume = 0.5
          correctSound.play().catch(err => console.error('❌ Correct sound error:', err))
        } catch (err) {
          console.error('❌ Failed to create correct sound:', err)
        }
      } else {
        console.log('❌ Wrong answer - playing shake and sound')
        triggerShake()
        // Play wrong sound
        try {
          const wrongSound = new Audio('/sounds/wrong_1.mp3')
          wrongSound.volume = 0.5
          wrongSound.play().catch(err => console.error('❌ Wrong sound error:', err))
        } catch (err) {
          console.error('❌ Failed to create wrong sound:', err)
        }
      }

      setTimeout(() => {
        setGameStatus('waiting')
        setResult(null)
      }, 5000)
    })

    socket.on('round_skipped' as any, (data: any) => {
      console.log('⏭️ Round skipped received:', JSON.stringify(data, null, 2))

      setResult({
        isCorrect: false,
        correct: false,
        correctAnswer: data.answer,
        answer: data.answer,  // Support both formats
        message: "Personne n'a trouvé !",
      })
      setGameStatus('result')
      setPlayers(data.leaderboard || [])
      setTimeLeft(null)
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Trigger shake for skipped round
      triggerShake()

      // Play timeout sound
      try {
        const timeoutSound = new Audio('/sounds/timeout_1.mp3')
        timeoutSound.volume = 0.5
        timeoutSound.play().catch(err => console.error('❌ Timeout sound error:', err))
      } catch (err) {
        console.error('❌ Failed to create timeout sound:', err)
      }

      setTimeout(() => {
        setGameStatus('waiting')
        setResult(null)
      }, 5000)
    })

    socket.on('bomb_holder_changed', (data: any) => {
      console.log('💣 Bomb holder changed:', data.bombHolder)
      setBombHolder(data.bombHolder)
    })

    socket.on('hint_revealed', (data: any) => {
      console.log('💡 Hint revealed:', data.hintIndex)
      setCurrentHintIndex(data.hintIndex)
    })

    socket.on('game_finished', (data: any) => {
      console.log('🏁 Game finished:', data)
      setFinalResults({
        leaderboard: data.leaderboard || [],
        totalRounds: data.totalRounds || 0
      })
      setGameStatus('finished')
      setPlayers(data.leaderboard || [])
      if (audioRef.current) audioRef.current.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Trigger confetti celebration
      fireConfetti()
    })

    return () => {
      socket.offAny()  // Remove the catch-all listener
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('round_started')
      socket.off('play_track')
      socket.off('stop_music')
      socket.off('buzz_locked')
      socket.off('resume_audio')
      socket.off('wrong_answer_continue')
      socket.off('round_result')
      socket.off('round_skipped')
      socket.off('bomb_holder_changed')
      socket.off('hint_revealed')
      socket.off('game_finished')
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
            <div className="text-center animate-fade-in space-y-12">
              <div className="text-9xl mb-8 animate-bounce">🎵</div>
              <h1 className="text-hero font-display font-bold mb-4">En attente...</h1>
              <p className="text-title text-text-secondary mb-12">
                {players.length} joueur{players.length > 1 ? 's' : ''} connecté
                {players.length > 1 ? 's' : ''}
              </p>

              {/* QR Code for players to join */}
              <div className="inline-block bg-white p-8 rounded-3xl shadow-2xl">
                <QRCodeCanvas
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/player/${roomCode}`}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="max-w-2xl mx-auto">
                <p className="text-2xl font-semibold text-primary mb-2">📱 Scannez pour rejoindre</p>
                <p className="text-xl text-text-secondary">
                  Ou rendez-vous sur <span className="font-mono font-bold text-primary">{typeof window !== 'undefined' ? window.location.host : ''}</span>
                </p>
                <p className="text-lg text-text-secondary mt-2">
                  Code de la salle : <span className="font-mono font-bold text-4xl text-primary">{roomCode}</span>
                </p>
              </div>
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

              {gameMode === 'tueurs_gages' ? (
                <div className="bg-error/20 border-4 border-error rounded-3xl p-8 relative z-10">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-3xl font-display font-bold text-error">
                    Mode Tueurs à Gages !
                  </p>
                  <p className="text-xl text-text-secondary mt-2">
                    Les joueurs sélectionnent leurs cibles...
                  </p>
                </div>
              ) : gameMode === 'chaud_devant' && bombHolder ? (
                <div className="bg-warning/20 border-4 border-warning rounded-3xl p-8 animate-pulse relative z-10">
                  <div className="text-6xl mb-4">💣</div>
                  <p className="text-2xl font-display font-bold text-warning">
                    {bombHolder} a la bombe !
                  </p>
                </div>
              ) : gameMode === 'questions_rafale' && hints.length > 0 ? (
                <div className="w-full max-w-4xl space-y-4 relative z-10">
                  <div className="bg-success/20 border-2 border-success/30 rounded-3xl p-6">
                    <h3 className="text-3xl font-display font-bold text-success text-center flex items-center justify-center gap-3">
                      <span className="text-5xl">💡</span>
                      <span>Indices</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hints.map((hint, index) => {
                      const isVisible = index <= currentHintIndex
                      return (
                        <div
                          key={index}
                          className={cn(
                            'relative rounded-2xl p-6 border-2 transition-all duration-500',
                            isVisible ? 'bg-success/20 border-success' : 'bg-bg-dark border-border opacity-40'
                          )}
                        >
                          <div className={cn(
                            'absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                            isVisible ? 'bg-success text-white' : 'bg-border text-text-secondary'
                          )}>
                            {index + 1}
                          </div>
                          {isVisible ? (
                            <p className="text-xl font-semibold text-center pt-4">{hint}</p>
                          ) : (
                            <div className="text-center pt-4">
                              <div className="text-4xl">🔒</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-2xl text-text-secondary relative z-10">Qui trouvera en premier ?</p>
              )}
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
          {gameStatus === 'result' && result && (() => {
            const isCorrect = result.isCorrect ?? result.correct ?? false
            const playerName = result.playerName ?? result.player?.name
            const points = result.pointsAwarded ?? result.points
            const answer = result.correctAnswer ?? result.answer

            console.log('🖼️ Rendering result:', {
              isCorrect,
              playerName,
              points,
              answer,
              rawResult: result
            })

            return (
              <div
                className={cn(
                  'text-center animate-fade-in',
                  isCorrect ? 'text-success' : 'text-error'
                )}
              >
                <div className="text-9xl mb-6 animate-bounce">
                  {isCorrect ? '🎉' : result.message ? '😔' : '😢'}
                </div>
                <h1 className="text-hero font-display font-bold mb-6">
                  {isCorrect ? 'Bravo !' : result.message ? result.message : 'Dommage !'}
                </h1>

                {isCorrect && playerName && (
                  <div className="text-3xl mb-8">
                    <strong>{playerName}</strong> gagne {points} points !
                  </div>
                )}

                {!isCorrect && result.message && (
                  <div className="text-3xl mb-8 text-warning">
                    ⏰ Temps écoulé - Aucun joueur n'a buzzé
                  </div>
                )}

                <div className="bg-bg-card rounded-3xl p-12 inline-block">
                  <div className="text-8xl mb-6">🎵</div>
                  <h2 className="text-2xl text-text-secondary mb-4">La réponse était :</h2>
                  <p className="text-4xl font-display font-bold">{answer}</p>
                </div>
              </div>
            )
          })()}

          {/* Finished State - Final Results */}
          {gameStatus === 'finished' && finalResults && (
            <div className="text-center animate-fade-in">
              <div className="text-9xl mb-6 animate-bounce">
                🏆
              </div>
              <h1 className="text-hero font-display font-bold mb-2 text-gradient-primary">
                Partie Terminée !
              </h1>
              <p className="text-2xl text-text-secondary mb-8">
                {finalResults.totalRounds} manche{finalResults.totalRounds > 1 ? 's' : ''} jouée{finalResults.totalRounds > 1 ? 's' : ''}
              </p>

              {/* Winner Podium */}
              {finalResults.leaderboard.length > 0 && (
                <div className="mb-12">
                  <div className="bg-primary/10 border-4 border-primary rounded-3xl p-8 inline-block">
                    <div className="text-8xl mb-4">👑</div>
                    <h2 className="text-4xl font-display font-bold text-primary mb-2">
                      {finalResults.leaderboard[0].name}
                    </h2>
                    <p className="text-5xl font-bold text-primary">
                      {finalResults.leaderboard[0].score} points
                    </p>
                  </div>
                </div>
              )}

              {/* Top 3 Podium */}
              {finalResults.leaderboard.length >= 3 && (
                <div className="flex justify-center gap-6 mb-8">
                  {/* 2nd Place */}
                  {finalResults.leaderboard[1] && (
                    <div className="bg-bg-card rounded-2xl p-6 border-2 border-border w-48">
                      <div className="text-5xl mb-2">🥈</div>
                      <h3 className="font-bold text-xl mb-1">{finalResults.leaderboard[1].name}</h3>
                      <p className="text-2xl font-bold text-text-secondary">{finalResults.leaderboard[1].score} pts</p>
                    </div>
                  )}

                  {/* 1st Place (already shown above with crown) */}

                  {/* 3rd Place */}
                  {finalResults.leaderboard[2] && (
                    <div className="bg-bg-card rounded-2xl p-6 border-2 border-border w-48">
                      <div className="text-5xl mb-2">🥉</div>
                      <h3 className="font-bold text-xl mb-1">{finalResults.leaderboard[2].name}</h3>
                      <p className="text-2xl font-bold text-text-secondary">{finalResults.leaderboard[2].score} pts</p>
                    </div>
                  )}
                </div>
              )}

              {/* Full Leaderboard */}
              <div className="bg-bg-card rounded-3xl p-8 inline-block max-w-2xl">
                <h3 className="font-display text-2xl font-bold mb-6 flex items-center justify-center gap-2">
                  <span>📊</span>
                  <span>Classement Final</span>
                </h3>
                <div className="space-y-2">
                  {finalResults.leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl',
                        index === 0 ? 'bg-primary/20 border-2 border-primary' :
                        index === 1 ? 'bg-border/20' :
                        index === 2 ? 'bg-border/20' :
                        'bg-bg-dark'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold w-8">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span className="font-semibold text-lg">{player.name}</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{player.score}</span>
                    </div>
                  ))}
                </div>
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
