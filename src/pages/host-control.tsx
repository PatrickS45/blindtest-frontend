import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import styles from '../styles/HostControl.module.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function HostControl() {
  const router = useRouter();
  const { roomCode: urlRoomCode } = router.query;

  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [playlistId, setPlaylistId] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [gameStatus, setGameStatus] = useState('setup');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [totalRounds] = useState(10);
  const [gameDuration, setGameDuration] = useState(0);

  // ✅ Utiliser useRef pour l'audio
  const audioRef = useRef(null);

  useEffect(() => {
    if (urlRoomCode) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      setRoomCode(urlRoomCode);
      setGameStatus('waiting');
    } else {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.emit('create_game', (response) => {
        if (response.success) {
          setRoomCode(response.roomCode);
          setGameStatus('waiting');
        }
      });
    }
  }, [urlRoomCode]);

  useEffect(() => {
    if (!socket) return;

    socket.on('player_joined', (data) => {
      setPlayers(data.players);
    });

    socket.on('player_left', (data) => {
      setPlayers(data.players);
    });

    socket.on('play_track', (data) => {
      setCurrentTrack(data);
      setGameStatus('playing');
      setRoundNumber(prev => prev + 1);

      // ✅ Jouer l'audio et stocker dans la ref
      const audio = new Audio(data.previewUrl);
      audio.play();
      audioRef.current = audio;

      // Auto-pause après 30 secondes
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }, data.duration * 1000);
    });

    socket.on('buzz_locked', (data) => {
      setBuzzedPlayer(data);
      setGameStatus('buzzed');

      // ✅ Mettre en pause l'audio quand quelqu'un buzze
      if (audioRef.current) {
        audioRef.current.pause();
        console.log('⏸️ Audio mis en pause (buzz_locked)');
      }
    });

    // ✅ ÉCOUTER resume_audio pour reprendre la musique
    socket.on('resume_audio', () => {
      console.log('▶️ Reprise audio demandée');
      if (audioRef.current) {
        audioRef.current.play();
        console.log('✅ Audio relancé');
      }
    });

    socket.on('round_result', (data) => {
      setPlayers(data.leaderboard);
      setBuzzedPlayer(null);
      setCurrentTrack(null);
      setGameStatus('waiting');

      // Arrêter l'audio si il joue encore
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('play_track');
      socket.off('buzz_locked');
      socket.off('round_result');
      socket.off('resume_audio');
    };
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadPlaylist = () => {
    if (!playlistId || !socket) return;

    socket.emit('load_playlist', { roomCode, playlistId }, (response) => {
      if (response.success) {
        setPlaylist(response.playlist);
      } else {
        alert('Erreur : ' + response.error);
      }
    });
  };

  const handleStartRound = () => {
    if (!socket || !playlist) return;
    socket.emit('start_round', { roomCode }, (response) => {
      if (!response.success) {
        alert('Erreur : ' + response.error);
      }
    });
  };

  const handleValidateAnswer = (isCorrect) => {
    if (!socket) return;

    // Le serveur gère maintenant la reprise de l'audio après 2 secondes
    socket.emit('validate_answer', { roomCode, isCorrect });
  };

  const handleSkipTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTrack(null);
    setBuzzedPlayer(null);
    setGameStatus('waiting');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.logo}>🎬 Contrôle Hôte</div>
          <div className={styles.roomBadge}>{roomCode}</div>
        </div>
        <div className={styles.headerStatus}>
          <div className={styles.statusItem}>
            <div className={styles.statusDot}></div>
            <span>En ligne</span>
          </div>
          <div className={styles.statusItem}>
            <span>👥 {players.length} joueurs</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.mainContent}>

        {/* État de la partie */}
        <div className={`${styles.sectionCard} ${styles.gameStatus}`}>
          <h2 className={styles.sectionTitle}>📊 État de la partie</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusBox}>
              <div className={styles.statusBoxLabel}>Manche</div>
              <div className={styles.statusBoxValue}>{roundNumber}/{totalRounds}</div>
            </div>
            <div className={styles.statusBox}>
              <div className={styles.statusBoxLabel}>Durée</div>
              <div className={styles.statusBoxValue}>{formatTime(gameDuration)}</div>
            </div>
            <div className={styles.statusBox}>
              <div className={styles.statusBoxLabel}>Joueurs</div>
              <div className={styles.statusBoxValue}>{players.length}</div>
            </div>
            <div className={styles.statusBox}>
              <div className={styles.statusBoxLabel}>Statut</div>
              <div className={styles.statusBoxValue} style={{fontSize: '1rem'}}>
                {gameStatus === 'waiting' && 'En attente'}
                {gameStatus === 'playing' && 'En cours'}
                {gameStatus === 'buzzed' && 'Buzzer'}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration playlist */}
        {gameStatus === 'waiting' && !playlist && (
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>🎵 Configuration Playlist</h2>
            <div className={styles.playlistInput}>
              <input
                type="text"
                placeholder="ID Playlist Deezer"
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleLoadPlaylist} className={styles.playlistLoadBtn}>
                Charger
              </button>
            </div>
          </div>
        )}

        {playlist && gameStatus === 'waiting' && (
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>✓ Playlist chargée</h2>
            <div className={styles.playlistInfo}>
              <strong>{playlist.title}</strong><br />
              {playlist.trackCount} titres disponibles
            </div>
          </div>
        )}

        {/* Titre en cours */}
        {(gameStatus === 'playing' || gameStatus === 'buzzed') && currentTrack && (
          <div className={`${styles.sectionCard} ${styles.currentTrack}`}>
            <h2 className={styles.sectionTitle}>🎵 Titre en cours</h2>
            <div className={styles.trackInfo}>
              <div className={styles.trackCover}>🎵</div>
              <div className={styles.trackDetails}>
                <div className={styles.trackTitle}>Extrait audio en lecture</div>
                <div className={styles.trackArtist}>30 secondes</div>
              </div>
            </div>
            <div className={styles.audioControls}>
              <button onClick={handleSkipTrack} className={styles.skipBtn}>
                ⏭️ Passer
              </button>
            </div>
          </div>
        )}

        {/* Buzzer activé */}
        {gameStatus === 'buzzed' && buzzedPlayer && currentTrack && (
          <div className={`${styles.sectionCard} ${styles.buzzerAlert}`}>
            <h2 className={styles.sectionTitle}>⚡ BUZZER ACTIVÉ !</h2>
            <div className={styles.buzzerPlayerCard}>
              <div className={styles.buzzerAvatar}>🎤</div>
              <div className={styles.buzzerPlayerInfo}>
                <div className={styles.buzzerPlayerName}>{buzzedPlayer.playerName}</div>
                <div className={styles.buzzerTime}>A buzzé en premier</div>
              </div>
            </div>

            {/* AFFICHAGE DU TITRE */}
            <div className={styles.answerSection}>
              <div className={styles.answerLabel}>Réponse correcte :</div>
              <div className={styles.answerTrack}>
                <div className={styles.answerTitle}>{currentTrack.title}</div>
                <div className={styles.answerArtist}>{currentTrack.artist}</div>
              </div>
            </div>

            <div className={styles.validationButtons}>
              <button
                onClick={() => handleValidateAnswer(true)}
                className={`${styles.btnValidate} ${styles.btnCorrect}`}
              >
                ✓ Bonne réponse
              </button>
              <button
                onClick={() => handleValidateAnswer(false)}
                className={`${styles.btnValidate} ${styles.btnWrong}`}
              >
                ✗ Mauvaise réponse
              </button>
            </div>

            <div className={styles.helpText}>
              💡 Écoute la réponse du joueur et valide
            </div>
          </div>
        )}

        {/* Joueurs connectés */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>👥 Joueurs ({players.length})</h2>
          <div className={styles.playerMiniList}>
            {players.map((player, index) => (
              <div key={player.name} className={styles.playerMiniItem}>
                <div className={styles.playerColorDot} style={{
                  background: `hsl(${(index * 360) / Math.max(players.length, 1)}, 70%, 60%)`
                }}></div>
                <span className={styles.playerMiniName}>{player.name}</span>
                <span className={styles.playerMiniScore}>{player.score}</span>
              </div>
            ))}
            {players.length === 0 && (
              <p className={styles.emptyPlayers}>Aucun joueur connecté</p>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>⚡ Actions rapides</h2>
          <div className={styles.quickActions}>
            <button className={styles.quickActionBtn}>
              <div className={styles.quickActionIcon}>📊</div>
              <div>Classement</div>
            </button>
            <button
              className={styles.quickActionBtn}
              onClick={() => router.push('/host/settings?code=' + roomCode)}
            >
              <div className={styles.quickActionIcon}>⚙️</div>
              <div>Paramètres</div>
            </button>
            <button className={styles.quickActionBtn}>
              <div className={styles.quickActionIcon}>🔄</div>
              <div>Redémarrer</div>
            </button>
            <button className={styles.quickActionBtn}>
              <div className={styles.quickActionIcon}>🚪</div>
              <div>Terminer</div>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom actions */}
      <div className={styles.bottomActions}>
        {gameStatus === 'waiting' && playlist && players.length > 0 && (
          <button onClick={handleStartRound} className={`${styles.mainActionBtn} ${styles.btnLaunch}`}>
            ▶️ Lancer {roundNumber === 0 ? 'la première' : 'une'} manche
          </button>
        )}
        {gameStatus === 'playing' && (
          <button onClick={handleSkipTrack} className={`${styles.mainActionBtn} ${styles.btnWarning}`}>
            ⏭️ Passer ce titre
          </button>
        )}
        {gameStatus === 'waiting' && (!playlist || players.length === 0) && (
          <div className={styles.waitingMessage}>
            {!playlist && '📝 Charge une playlist pour commencer'}
            {playlist && players.length === 0 && '⏳ En attente de joueurs...'}
          </div>
        )}
      </div>
    </div>
  );
}
