// Display.tsx - Avec écran de connexion

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Display.module.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function Display() {
  const router = useRouter();
  const { room: roomFromUrl } = router.query;

  const [roomCode, setRoomCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerDuration, setTimerDuration] = useState(10);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Auto-connexion si code dans URL
  useEffect(() => {
    if (roomFromUrl && typeof roomFromUrl === 'string') {
      setRoomCode(roomFromUrl);
      handleConnect(roomFromUrl);
    }
  }, [roomFromUrl]);

  const handleConnect = (code) => {
    const finalCode = code || roomCode;

    if (!finalCode || finalCode.length !== 4) {
      alert('Code invalide (4 caractères)');
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_game', {
      roomCode: finalCode.toUpperCase(),
      playerName: `Display-${finalCode}`
    }, (response) => {
      if (response.success) {
        console.log('📺 Display connecté');
        setConnected(true);
        setPlayers(response.players || []);
      } else {
        alert('Erreur: ' + response.error);
        newSocket.close();
      }
    });

    newSocket.on('player_joined', (data) => setPlayers(data.players || []));
    newSocket.on('player_left', (data) => setPlayers(data.players || []));

    newSocket.on('play_track', (data) => {
      setGameStatus('playing');
      setBuzzedPlayer(null);
      setResult(null);
      setTimerDuration(data.timerDuration || 10);
      setTimeLeft(data.timerDuration || 10);

      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(data.previewUrl);
      audio.volume = data.volume || 0.7;
      audio.play().catch(err => console.error('❌ Audio error:', err));
      audioRef.current = audio;

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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
      setResult({ correct: false, player: null, answer: data.answer, message: 'Personne n\'a trouvé !' });
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
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (socket) socket.close();
    };
  }, [socket]);

  // ÉCRAN DE CONNEXION
  if (!connected) {
    return (
      <div className={styles.container}>
        <div className={styles.connectScreen}>
          <h1>📺 Display TV</h1>
          <p>Affichage pour tous les joueurs</p>
          <input
            type="text"
            placeholder="CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className={styles.codeInput}
            maxLength={4}
            onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
          />
          <button onClick={() => handleConnect()} className={styles.connectButton}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // ÉCRAN DE JEU
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>🎵 BLIND TEST</div>
        <div className={styles.roomCode}>{roomCode.toUpperCase()}</div>
        <div className={styles.status}><div className={styles.statusDot}></div>En direct</div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.mainZone}>
          {gameStatus === 'waiting' && (
            <div className={styles.waitingState}>
              <h1>🎵 En attente...</h1>
              <div className={styles.qrSection}>
                <p>{players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {gameStatus === 'playing' && (
            <div className={styles.playingState}>
              {timeLeft !== null && (
                <div className={styles.answerTimerBig}>
                  <div className={`${styles.timerCircleBig} ${timeLeft <= 3 && timeLeft > 0 ? styles.urgent : ''} ${timeLeft <= 0 ? styles.overtime : ''}`}>
                    <div className={styles.timerValueBig}>{timeLeft > 0 ? Math.ceil(timeLeft) : '⏰'}</div>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={`${styles.progressFill} ${timeLeft <= 3 ? styles.urgent : ''}`} style={{ width: `${Math.max(0, (timeLeft / timerDuration) * 100)}%` }} />
                  </div>
                  {timeLeft <= 0 && <p className={styles.overtimeMessage}>⚠️ Temps écoulé - Le MC décide</p>}
                </div>
              )}
              <div className={styles.audioVisualizer}>
                <div className={styles.soundWaves}>{[...Array(12)].map((_, i) => <div key={i} className={styles.wave} />)}</div>
              </div>
              <p className={styles.instruction}>Qui trouvera en premier ?</p>
            </div>
          )}

          {gameStatus === 'buzzed' && buzzedPlayer && (
            <div className={styles.buzzedState}>
              <div className={styles.buzzedPlayer}>
                <div className={styles.playerAvatar} style={{ background: buzzedPlayer.playerColor || '#FF3366' }}>🎤</div>
                <h2>{buzzedPlayer.playerName}</h2>
                <p>a buzzé !</p>
              </div>
            </div>
          )}

          {gameStatus === 'result' && result && (
            <div className={`${styles.resultState} ${result.correct ? styles.correct : styles.wrong}`}>
              <h1>{result.correct ? '🎉 Bravo !' : '😢 Dommage !'}</h1>
              {result.correct && result.player && (
                <div className={styles.scoreUpdate}><strong>{result.player.name}</strong> gagne {result.points} points !</div>
              )}
              <div className={styles.trackReveal}>
                <div className={styles.trackCover}>🎵</div>
                <div className={styles.trackInfo}><h2>La réponse était :</h2><p>{result.answer}</p></div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <h3>🏆 Classement</h3>
          <div className={styles.playerList}>
            {players.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.5 }}>Aucun joueur</p>
            ) : (
              players.sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, index) => (
                <div key={player.name || index} className={`${styles.playerItem} ${index === 0 ? styles.first : ''}`}>
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
