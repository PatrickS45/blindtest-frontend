'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { useSoundEffect } from '@/hooks/useAudio'
import { Buzzer } from '@/components/game/Buzzer'
import { TeamSelector } from '@/components/team/TeamSelector'
import { Team, PlayMode, TriviaOption } from '@/types/game'
import { cn } from '@/lib/utils'
import { TriviaPlayerView, TriviaWaiting } from '@/components/game/TriviaPlayerView'
import { getSoundManager } from '@/utils/SoundManager'

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
  const [isJoining, setIsJoining] = useState(false)
  const [playMode, setPlayMode] = useState<PlayMode>('solo')
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [teamSelected, setTeamSelected] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'locked' | 'trivia'>('waiting')
  const [canBuzz, setCanBuzz] = useState(false)
  const [buzzedPlayer, setBuzzedPlayer] = useState('')
  const [myScore, setMyScore] = useState(0)
  const [myBuzzerSound, setMyBuzzerSound] = useState<number | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [answerTimer, setAnswerTimer] = useState(0)
  const [lastResult, setLastResult] = useState<any>(null)
  const [gameMode, setGameMode] = useState<string>('accumul_points')
  const [myBuzzPosition, setMyBuzzPosition] = useState<number | null>(null)

  // Trivia-specific state
  const [triviaQuestion, setTriviaQuestion] = useState<{
    question: string
    options: TriviaOption[]
    category?: string
    difficulty?: string
    timeout: number
  } | null>(null)
  const [triviaSelectedOption, setTriviaSelectedOption] = useState<number | null>(null)
  const [triviaTimeRemaining, setTriviaTimeRemaining] = useState(20)
  const [triviaMyResult, setTriviaMyResult] = useState<{
    isCorrect: boolean
    pointsAwarded: number
    newScore: number
  } | null>(null)

  const myBuzzerSoundRef = useRef<number | null>(null)
  const soundManagerRef = useRef(getSoundManager(80))
  const triviaTimerRef = useRef<NodeJS.Timeout | null>(null)

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

    console.log('👤 [JOIN DEBUG] Joining game:', roomCode, playerName)

    // Generate a random buzzer sound (1-23)
    const buzzerSound = Math.floor(Math.random() * 23) + 1
    setMyBuzzerSound(buzzerSound)
    myBuzzerSoundRef.current = buzzerSound

    // Save player name
    localStorage.setItem('blindtest_player_name', playerName)

    // Emit join request
    socket.emit('join_game', { roomCode, playerName })

    // Mark as joining (will be confirmed by player_joined event)
    setIsJoining(true)

    // Timeout in case server doesn't respond (10 seconds)
    setTimeout(() => {
      if (!joined) {
        console.error('❌ [JOIN DEBUG] Join timeout - server did not respond')
        setIsJoining(false)
        alert('Erreur: Impossible de rejoindre la partie. Vérifiez le code de la salle.')
      }
    }, 10000)
  }

  // Join team
  const handleJoinTeam = () => {
    if (!socket || !selectedTeamId) return

    console.log('👥 [TEAM DEBUG] Emitting join_team:', { roomCode, teamId: selectedTeamId })
    socket.emit('join_team', { roomCode, teamId: selectedTeamId })
    setTeamSelected(true)
  }

  // Socket event listeners - Game state and player joined (needed before joined=true)
  useEffect(() => {
    if (!socket) return

    // Game state - listen even when joining (to get playMode and teams before showing UI)
    socket.on('game_state', (data: any) => {
      console.log('👥 [TEAM DEBUG] game_state event received:', data)
      if (data.playMode) {
        console.log('👥 [TEAM DEBUG] Play mode:', data.playMode)
        setPlayMode(data.playMode)
      }
      if (data.teams) {
        console.log('👥 [TEAM DEBUG] Teams in game_state:', data.teams)
        setTeams(data.teams)
      }
    })

    // Player joined - this confirms we successfully joined
    socket.on('player_joined', (data: any) => {
      console.log('👥 [JOIN DEBUG] player_joined event received:', data)

      // Check if it's me who just joined
      const myPlayer = data.players?.find((p: any) => p.name === playerName)
      if (myPlayer && isJoining) {
        console.log('✅ [JOIN DEBUG] Successfully joined! My player:', myPlayer)
        setMyScore(myPlayer.score || 0)
        setJoined(true)
        setIsJoining(false)
      }
    })

    return () => {
      socket.off('game_state')
      socket.off('player_joined')
    }
  }, [socket, playerName, isJoining])

  // Socket event listeners - Game events (only when joined)
  useEffect(() => {
    if (!socket || !joined) return

    // Team events
    socket.on('teams_updated', (data: any) => {
      console.log('👥 [TEAM DEBUG] teams_updated event received:', data)
      setTeams(data.teams)
    })

    socket.on('player_joined_team', (data: any) => {
      console.log('👥 [TEAM DEBUG] player_joined_team event received:', data)
      setTeams(data.teams)
    })

    socket.on('round_started', (data: any) => {
      console.log('🎵 [PLAYER DEBUG] Round started:', data)

      // Update round number
      setRoundNumber((prev) => prev + 1)

      // Capture game mode
      if (data.mode) {
        console.log('🎮 [MODE DEBUG] Mode found in data.mode:', data.mode)
        setGameMode(data.mode)
      } else if (data.round?.mode) {
        console.log('🎮 [MODE DEBUG] Mode found in data.round.mode:', data.round.mode)
        setGameMode(data.round.mode)
      } else {
        console.warn('⚠️ [MODE DEBUG] No mode found in round_started event!')
      }

      // Handle TRIVIA mode
      if (data.mode === 'trivia' && data.round?.qcm?.type === 'trivia') {
        console.log('🤔 [TRIVIA] Player - Round started with question:', data.round.qcm)
        setTriviaQuestion(data.round.qcm)
        setTriviaTimeRemaining(data.round.qcm.timeout || 20)
        setTriviaSelectedOption(null)
        setTriviaMyResult(null)
        setGameStatus('trivia')

        // Start countdown
        if (triviaTimerRef.current) clearInterval(triviaTimerRef.current)
        triviaTimerRef.current = setInterval(() => {
          setTriviaTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(triviaTimerRef.current!)
              soundManagerRef.current.play('timeUp')
              return 0
            }
            if (prev === 6) {
              soundManagerRef.current.play('countdownUrgent')
            }
            return prev - 1
          })
        }, 1000)

        return
      }

      // Default behavior for other modes
      setGameStatus('playing')
      setCanBuzz(true)
      setLastResult(null)
      setBuzzedPlayer('')
      setAnswerTimer(0)
      setMyBuzzPosition(null)
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

    socket.on('qcm_result', (data: any) => {
      console.log('📊 [TRIVIA] Player - QCM Results received:', data)

      if (triviaTimerRef.current) clearInterval(triviaTimerRef.current)

      // Find my result
      const myResult = data.results.find((r: any) => r.playerName === playerName)
      if (myResult) {
        setTriviaMyResult({
          isCorrect: myResult.isCorrect,
          pointsAwarded: myResult.pointsAwarded,
          newScore: myResult.newScore,
        })
        setMyScore(myResult.newScore)

        // Play sound and vibration
        if (myResult.isCorrect) {
          soundManagerRef.current.play('correct')
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50]) // Happy vibration
          }
        } else {
          soundManagerRef.current.play('wrong')
          if ('vibrate' in navigator) {
            navigator.vibrate([200]) // Sad vibration
          }
        }
      }

      // Reset after 8 seconds
      setTimeout(() => {
        setGameStatus('waiting')
        setTriviaQuestion(null)
        setTriviaMyResult(null)
        setTriviaSelectedOption(null)
      }, 8000)
    })

    socket.on('game_ended', () => {
      console.log('🏁 Game ended')
      router.push('/')
    })

    return () => {
      socket.off('teams_updated')
      socket.off('player_joined_team')
      socket.off('round_started')
      socket.off('buzz_locked')
      socket.off('timeout_warning')
      socket.off('round_result')
      socket.off('wrong_answer_continue')
      socket.off('timeout_continue')
      socket.off('qcm_result')
      socket.off('game_ended')
    }
  }, [socket, joined, playerName, playCorrect, playWrong, playTimeout, router, triviaQuestion])

  const handleBuzz = () => {
    if (!socket) return
    socket.emit('buzz', { roomCode })
  }

  const handleTriviaAnswer = (optionIndex: number) => {
    if (!socket || !triviaQuestion) return

    console.log('📝 [TRIVIA] Submitting answer:', optionIndex)
    setTriviaSelectedOption(optionIndex)

    socket.emit('submit_qcm_answer', {
      roomCode,
      optionIndex,
      timestamp: Date.now(),
    })
  }

  // Join screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary p-6 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-hero font-display font-bold mb-2 text-gradient-primary">
              {isJoining ? 'Connexion...' : 'Rejoindre'}
            </h1>
            <p className="text-text-secondary">Code : {roomCode}</p>
          </div>

          <div className="bg-bg-card rounded-3xl p-8 border-2 border-primary/20">
            {isJoining ? (
              <div className="text-center py-8">
                <div className="animate-spin text-6xl mb-4">⏳</div>
                <p className="text-text-secondary">Connexion en cours...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Team selection screen (team mode only)
  if (joined && playMode === 'team' && !teamSelected) {
    return (
      <TeamSelector
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
        onConfirm={handleJoinTeam}
      />
    )
  }

  // TRIVIA mode - dedicated view
  if (gameMode === 'trivia' && gameStatus === 'trivia' && triviaQuestion) {
    return (
      <TriviaPlayerView
        question={triviaQuestion.question}
        options={triviaQuestion.options}
        timeRemaining={triviaTimeRemaining}
        initialTime={triviaQuestion.timeout}
        onAnswer={handleTriviaAnswer}
        selectedOption={triviaSelectedOption}
        showResults={triviaMyResult !== null}
        myResult={triviaMyResult}
        disabled={triviaTimeRemaining <= 0}
      />
    )
  }

  // TRIVIA mode - waiting state
  if (gameMode === 'trivia' && gameStatus === 'waiting') {
    return <TriviaWaiting roundNumber={roundNumber + 1} />
  }

  // Game screen (for buzzer modes)
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
