'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { Button } from '@/components/ui/Button'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { Player } from '@/types/game'
import { cn } from '@/lib/utils'

interface Playlist {
  title: string
  trackCount: number
}

interface TrackData {
  title: string
  artist: string
  previewUrl: string
  duration: number
  startTime?: number
}

interface BuzzedPlayer {
  playerName: string
  position?: number
}

export default function HostControl() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  const { socket, isConnected } = useSocket()

  const [players, setPlayers] = useState<Player[]>([])
  const [playlistId, setPlaylistId] = useState<string>('')
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [gameStatus, setGameStatus] = useState<'setup' | 'waiting' | 'playing' | 'buzzed'>('setup')
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null)
  const [buzzedPlayer, setBuzzedPlayer] = useState<BuzzedPlayer | null>(null)
  const [roundNumber, setRoundNumber] = useState<number>(0)
  const [totalRounds] = useState<number>(10)
  const [gameDuration, setGameDuration] = useState<number>(0)
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false)
  const [gameMode, setGameMode] = useState<string>('accumul_points')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Join as host
  useEffect(() => {
    if (!socket || !isConnected || !roomCode) return

    console.log('🎬 Joining as host for room:', roomCode)
    socket.emit('join_as_host', { roomCode })
    setGameStatus('waiting')
  }, [socket, isConnected, roomCode])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('player_joined', (data: any) => {
      setPlayers(data.players)
    })

    socket.on('player_left', (data: any) => {
      setPlayers(data.players)
    })

    socket.on('round_started', (data: any) => {
      // Capture game mode
      if (data.mode) {
        setGameMode(data.mode)
      }
    })

    socket.on('play_track', (data: TrackData) => {
      setCurrentTrack(data)
      setGameStatus('playing')
      setRoundNumber((prev) => prev + 1)

      // Play audio
      const audio = new Audio(data.previewUrl)

      // Si un startTime est fourni, attendre que l'audio soit chargé puis seek
      if (data.startTime && data.startTime > 0) {
        audio.addEventListener('loadedmetadata', () => {
          audio.currentTime = data.startTime
          console.log('🎲 Audio starting at', data.startTime, 'seconds')
        }, { once: true })
      }

      audio.play().catch((err) => console.error('Audio play error:', err))
      audioRef.current = audio

      // Note: Le backend gère le timeout de 30s avec auto-skip
      // Pas besoin de setTimeout ici, ça cause des coupures prématurées
    })

    socket.on('buzz_locked', (data: BuzzedPlayer) => {
      setBuzzedPlayer(data)
      setGameStatus('buzzed')

      // Pause audio on buzz
      if (audioRef.current) {
        audioRef.current.pause()
      }
    })

    socket.on('resume_audio', () => {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => console.error('Resume audio error:', err))
      }
    })

    socket.on('round_result', (data: any) => {
      setPlayers(data.leaderboard)
      setBuzzedPlayer(null)
      setCurrentTrack(null)
      setGameStatus('waiting')

      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    })

    return () => {
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('round_started')
      socket.off('play_track')
      socket.off('buzz_locked')
      socket.off('round_result')
      socket.off('resume_audio')
    }
  }, [socket])

  // Game duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setGameDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleLoadPlaylist = () => {
    if (!playlistId || !socket) return

    setIsLoadingPlaylist(true)
    console.log('🎵 Loading playlist:', playlistId)
    socket.emit('load_playlist', { roomCode, playlistId })

    // Listen for playlist loaded event
    socket.once('playlist_loaded', (data: any) => {
      setIsLoadingPlaylist(false)
      setPlaylist({ title: data.playlistName, trackCount: data.trackCount })
    })

    socket.once('playlist_error', (data: any) => {
      setIsLoadingPlaylist(false)
      alert('Erreur : ' + data.message)
    })
  }

  const handleStartRound = () => {
    if (!socket || !playlist) {
      console.log('❌ Cannot start round - socket:', !!socket, 'playlist:', !!playlist)
      return
    }
    console.log('▶️ Starting round - roomCode:', roomCode, 'socket.id:', socket.id, 'connected:', socket.connected)
    socket.emit('start_round', { roomCode })
  }

  const handleValidateAnswer = (isCorrect: boolean) => {
    if (!socket) return
    socket.emit('validate_answer', { roomCode, isCorrect })
  }

  const handleSkipTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setCurrentTrack(null)
    setBuzzedPlayer(null)
    setGameStatus('waiting')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary pb-24">
      {/* Header */}
      <header className="bg-bg-card border-b-2 border-primary/20 p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold">🎬 Contrôle Hôte</h1>
            <div className="font-mono text-3xl font-bold bg-primary/20 px-6 py-2 rounded-xl border-2 border-primary">
              {roomCode.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success' : 'bg-error')} />
              <span>{isConnected ? 'En ligne' : 'Déconnecté'}</span>
            </div>
            <div>👥 {players.length} joueur{players.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Game Status */}
        <div className="bg-bg-card rounded-3xl p-6 border-2 border-primary/20">
          <h2 className="font-display text-xl font-semibold mb-4">📊 État de la partie</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-text-secondary text-sm mb-1">Manche</div>
              <div className="font-display text-3xl font-bold text-primary">
                {roundNumber}/{totalRounds}
              </div>
            </div>
            <div className="text-center">
              <div className="text-text-secondary text-sm mb-1">Durée</div>
              <div className="font-mono text-3xl font-bold">{formatTime(gameDuration)}</div>
            </div>
            <div className="text-center">
              <div className="text-text-secondary text-sm mb-1">Joueurs</div>
              <div className="font-display text-3xl font-bold">{players.length}</div>
            </div>
            <div className="text-center">
              <div className="text-text-secondary text-sm mb-1">Statut</div>
              <div className="text-lg font-semibold">
                {gameStatus === 'waiting' && '⏳ Attente'}
                {gameStatus === 'playing' && '▶️ En cours'}
                {gameStatus === 'buzzed' && '⚡ Buzzer'}
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Configuration */}
        {gameStatus === 'waiting' && !playlist && (
          <div className="bg-bg-card rounded-3xl p-6 border-2 border-primary/20">
            <h2 className="font-display text-xl font-semibold mb-4">🎵 Configuration Playlist</h2>
            <div className="space-y-4">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4">
                <p className="text-sm text-text-secondary mb-2">
                  💡 Créez vos playlists via l'interface de gestion :
                </p>
                <a
                  href="https://blindtest-backend-cfbp.onrender.com/playlist-manager.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  → Ouvrir le gestionnaire de playlists
                </a>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="ID Playlist R2 (ex: ab04c62031e8298ad3e3023858224480)"
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                  className="flex-1 bg-bg-dark text-text-primary px-4 py-3 rounded-xl border-2 border-primary/30 focus:border-primary focus:outline-none font-mono text-sm"
                />
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleLoadPlaylist}
                  disabled={!playlistId || isLoadingPlaylist}
                  loading={isLoadingPlaylist}
                >
                  Charger
                </Button>
              </div>

              <p className="text-xs text-text-secondary">
                ℹ️ L'ID de playlist est un code hexadécimal de 32 caractères (ex: ab04c62031e8298ad3e3023858224480)
              </p>
            </div>
          </div>
        )}

        {/* Playlist Loaded */}
        {playlist && gameStatus === 'waiting' && (
          <div className="bg-success/10 rounded-3xl p-6 border-2 border-success">
            <h2 className="font-display text-xl font-semibold mb-2 text-success">✓ Playlist chargée</h2>
            <p className="text-text-primary">
              <strong>{playlist.title}</strong>
            </p>
            <p className="text-text-secondary text-sm">{playlist.trackCount} titres disponibles</p>
          </div>
        )}

        {/* Current Track */}
        {(gameStatus === 'playing' || gameStatus === 'buzzed') && currentTrack && (
          <div className="bg-bg-card rounded-3xl p-6 border-2 border-primary animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-4">🎵 Titre en cours</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl">
                🎵
              </div>
              <div>
                <div className="font-semibold">Extrait audio en lecture</div>
                <div className="text-text-secondary text-sm">30 secondes</div>
              </div>
            </div>
            <Button variant="secondary" size="medium" onClick={handleSkipTrack}>
              ⏭️ Passer
            </Button>
          </div>
        )}

        {/* Buzz Alert */}
        {gameStatus === 'buzzed' && buzzedPlayer && currentTrack && (
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl p-6 border-4 border-primary animate-pulse">
            <h2 className="font-display text-2xl font-semibold mb-6 text-center">⚡ BUZZER ACTIVÉ !</h2>

            {/* Buzzed Player */}
            <div className="bg-bg-card rounded-2xl p-6 mb-6 flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-3xl">
                {gameMode === 'reflexoquiz' && buzzedPlayer.position ? (
                  buzzedPlayer.position === 1 ? '🥇' : buzzedPlayer.position === 2 ? '🥈' : '🥉'
                ) : (
                  '🎤'
                )}
              </div>
              <div>
                <div className="font-display text-2xl font-bold">{buzzedPlayer.playerName}</div>
                <div className="text-text-secondary">
                  {gameMode === 'reflexoquiz' && buzzedPlayer.position ? (
                    buzzedPlayer.position === 1 ? '1er à buzzer (+15 pts)' :
                    buzzedPlayer.position === 2 ? '2e à buzzer (+10 pts)' :
                    '3e à buzzer (+5 pts)'
                  ) : (
                    'A buzzé en premier'
                  )}
                </div>
              </div>
            </div>

            {/* Correct Answer */}
            <div className="bg-bg-dark rounded-2xl p-6 mb-6">
              <div className="text-text-secondary mb-2">Réponse correcte :</div>
              <div className="font-display text-2xl font-bold mb-1">{currentTrack.title}</div>
              <div className="text-xl text-text-secondary">{currentTrack.artist}</div>
            </div>

            {/* Validation Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button
                variant="success"
                size="large"
                onClick={() => handleValidateAnswer(true)}
                className="text-xl"
              >
                ✓ Bonne réponse
              </Button>
              <Button
                variant="danger"
                size="large"
                onClick={() => handleValidateAnswer(false)}
                className="text-xl"
              >
                ✗ Mauvaise réponse
              </Button>
            </div>

            <p className="text-center text-sm text-text-secondary">
              💡 Écoute la réponse du joueur et valide
            </p>
          </div>
        )}

        {/* Players Leaderboard */}
        <div className="bg-bg-card rounded-3xl p-6 border-2 border-primary/20">
          <h2 className="font-display text-xl font-semibold mb-4">
            👥 Classement ({players.length})
          </h2>
          <Leaderboard players={players} compact />
        </div>

        {/* Quick Actions */}
        <div className="bg-bg-card rounded-3xl p-6 border-2 border-primary/20">
          <h2 className="font-display text-xl font-semibold mb-4">⚡ Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="bg-bg-dark rounded-2xl p-4 hover:bg-bg-medium transition-colors">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm">Classement</div>
            </button>
            <button className="bg-bg-dark rounded-2xl p-4 hover:bg-bg-medium transition-colors">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="text-sm">Paramètres</div>
            </button>
            <button className="bg-bg-dark rounded-2xl p-4 hover:bg-bg-medium transition-colors">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-sm">Redémarrer</div>
            </button>
            <button
              onClick={() => router.push('/host')}
              className="bg-bg-dark rounded-2xl p-4 hover:bg-bg-medium transition-colors"
            >
              <div className="text-3xl mb-2">🚪</div>
              <div className="text-sm">Nouvelle</div>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t-2 border-primary/20 p-4 z-20">
        <div className="max-w-7xl mx-auto">
          {gameStatus === 'waiting' && playlist && players.length > 0 && (
            <Button
              variant="primary"
              size="xl"
              onClick={handleStartRound}
              className="w-full"
            >
              ▶️ Lancer {roundNumber === 0 ? 'la première' : 'une'} manche
            </Button>
          )}

          {gameStatus === 'playing' && (
            <Button variant="danger" size="xl" onClick={handleSkipTrack} className="w-full">
              ⏭️ Passer ce titre
            </Button>
          )}

          {gameStatus === 'waiting' && (!playlist || players.length === 0) && (
            <div className="text-center text-text-secondary">
              {!playlist && '📝 Charge une playlist pour commencer'}
              {playlist && players.length === 0 && '⏳ En attente de joueurs...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
