// Display.jsx - Adapté à ton CSS existant

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Display.module.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function Display() {
  const router = useRouter();
  const { room } = router.query;

  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const [result, setResult] = useState(null);

  // Timer visuel
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerDuration, setTimerDuration] = useState(10);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (!room) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_game', {
      roomCode: room,
      playerName: `Display-${room}`
    }, (response) => {
      if (response.success) {
        console.log('📺 Display connecté:', room);
        setPlayers(response.players || []);
      }
    });

    newSocket.on('player_joined', (data) => {
      setPlayers(data.players || []);
    });

    newSocket.on('player_left', (data) => {
      setPlayers(data.players || []);
    });

    // JOUER LA MUSIQUE + TIMER
    newSocket.on('play_track', (data) => {
      console.log('🎵 play_track reçu:', data);
      setGameStatus('playing');
      setBuzzedPlayer(null);
      setResult(null);

      const duration = data.timerDuration || 10;
      setTimerDuration(duration);
      setTimeLeft(duration);

      // Audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(data.previewUrl);
      audio.volume = data.volume || 0.7;
      audio.addEventListener('ended', () => console.log('🎵 Fin'));
      audio.addEventListener('error', (e) => console.error('❌ Erreur:', e));
      audio.play().catch(err => console.error('❌ Play error:', err));
      audioRef.current = audio;

      // Timer visuel
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => (prev === null ? null : prev - 0.1));
      }, 100);
    });

    newSocket.on('stop_music', () => {
      if (audioRef.current) audioRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    });

    newSocket.on('buzz_locked', (data) => {
      setBuzzedPlayer(data);
      setGameStatus('buzzed');
      if (audioRef.current) audioRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    });

    newSocket.on('round_result', (data) => {
      setResult(data);
      setGameStatus('result');
      setBuzzedPlayer(null);
      setPlayers(data.leaderboard || []);
      setTimeLeft(null);
      if (audioRef.current) audioRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      setTimeout(() => {
        setGameStatus('waiting');
        setResult(null);
      }, 5000);
    });

    newSocket.on('round_skipped', (data) => {
      setResult({
        correct: false,
        player: null,
        answer: data.answer,
        message: 'Personne n\'a trouvé !'
      });
      setGameStatus('result');
      setPlayers(data.leaderboard || []);
      setTimeLeft(null);
      if (audioRef.current) audioRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      setTimeout(() => {
        setGameStatus('waiting');
        setResult(null);
      }, 5000);
    });

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      newSocket.close();
    };
  }, [room]);

  if (!room) {
    return <div className={styles.container}><p>Chargement...</p></div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>🎵 BLIND TEST</div>
        <div className={styles.roomCode}>{room}</div>
        <div className={styles.status}>
          <div className={styles.statusDot}></div>
          En direct
        </div>
      </div>

      {/* Layout principal */}
      <div className={styles.mainLayout}>
        {/* Zone principale */}
        <div className={styles.mainZone}>

          {/* EN ATTENTE */}
          {gameStatus === 'waiting' && (
            <div className={styles.waitingState}>
              <h1>🎵 En attente...</h1>
              <div className={styles.qrSection}>
                <p>{players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {/* MUSIQUE EN COURS */}
          {gameStatus === 'playing' && (
            <div className={styles.playingState}>
              {timeLeft !== null && (
                <div className={styles.answerTimerBig}>
                  <div className={`${styles.timerCircleBig} ${
                    timeLeft <= 3 && timeLeft > 0 ? styles.urgent : ''
                  } ${timeLeft <= 0 ? styles.overtime : ''}`}>
                    <div className={styles.timerValueBig}>
                      {timeLeft > 0 ? Math.ceil(timeLeft) : '⏰'}
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${timeLeft <= 3 ? styles.urgent : ''}`}
                      style={{
                        width: `${Math.max(0, (timeLeft / timerDuration) * 100)}%`,
                        transition: timeLeft <= 0 ? 'none' : 'width 0.1s linear'
                      }}
                    />
                  </div>

                  {timeLeft <= 0 && (
                    <p className={styles.overtimeMessage}>
                      ⚠️ Temps écoulé - Le MC décide
                    </p>
                  )}
                </div>
              )}

              <div className={styles.audioVisualizer}>
                <div className={styles.soundWaves}>
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className={styles.wave} />
                  ))}
                </div>
              </div>

              <p className={styles.instruction}>Qui trouvera en premier ?</p>
            </div>
          )}

          {/* QUELQU'UN A BUZZÉ */}
          {gameStatus === 'buzzed' && buzzedPlayer && (
            <div className={styles.buzzedState}>
              <div className={styles.buzzedPlayer}>
                <div
                  className={styles.playerAvatar}
                  style={{ background: buzzedPlayer.playerColor || '#FF3366' }}
                >
                  🎤
                </div>
                <h2>{buzzedPlayer.playerName}</h2>
                <p>a buzzé !</p>
                {timeLeft !== null && (
                  <p style={{ marginTop: '1rem', color: '#FFD700' }}>
                    Temps restant: {Math.max(0, Math.ceil(timeLeft))}s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* RÉSULTAT */}
          {gameStatus === 'result' && result && (
            <div className={`${styles.resultState} ${result.correct ? styles.correct : styles.wrong}`}>
              <h1>{result.correct ? '🎉 Bravo !' : '😢 Dommage !'}</h1>

              {result.correct && result.player && (
                <div className={styles.scoreUpdate}>
                  <strong>{result.player.name}</strong> gagne {result.points} points !
                </div>
              )}

              <div className={styles.trackReveal}>
                <div className={styles.trackCover}>🎵</div>
                <div className={styles.trackInfo}>
                  <h2>La réponse était :</h2>
                  <p>{result.answer}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR CLASSEMENT */}
        <div className={styles.sidebar}>
          <h3>🏆 Classement</h3>
          <div className={styles.playerList}>
            {players.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.5 }}>Aucun joueur</p>
            ) : (
              players
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((player, index) => (
                  <div
                    key={player.name || index}
                    className={`${styles.playerItem} ${index === 0 ? styles.first : ''}`}
                  >
                    <div className={styles.rank}>#{index + 1}</div>
                    <div className={styles.playerName}>{player.name}</div>
                    <div className={styles.playerScore}>{player.score || 0}</div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
