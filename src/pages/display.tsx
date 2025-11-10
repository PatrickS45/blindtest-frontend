import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import QRCode from 'qrcode.react';
import styles from '../styles/Display.module.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Configuration des variations de sons
const SOUND_VARIATIONS = {
  correct: 2,   // 2 variations pour les bonnes réponses
  wrong: 2,     // 2 variations pour les mauvaises réponses
  timeout: 1    // 1 variation pour le timeout
};

// Fonction pour jouer les sons de feedback
const playFeedbackSound = (isCorrect, isTimeout = false) => {
  try {
    let soundType = 'correct';

    if (isTimeout && SOUND_VARIATIONS.timeout > 0) {
      soundType = 'timeout';
    } else if (!isCorrect) {
      soundType = 'wrong';
    }

    const maxVariations = SOUND_VARIATIONS[soundType];
    const randomVariation = Math.floor(Math.random() * maxVariations) + 1;
    const soundFile = `/sounds/${soundType}_${randomVariation}.mp3`;

    console.log('🔊 Lecture son Display:', soundFile);

    const audio = new Audio(soundFile);
    audio.volume = 1.0; // Volume max pour le Display
    audio.play().catch(err => {
      console.error('Erreur lecture son feedback:', err);
    });
  } catch (error) {
    console.error('Erreur chargement son feedback:', error);
  }
};

export default function Display() {
  const router = useRouter();
  const { code } = router.query;

  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState(
    typeof code === 'string' ? code : (Array.isArray(code) ? code[0] : '') || ''
  );
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, buzzed, result
  const [players, setPlayers] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [answerTimer, setAnswerTimer] = useState(0); // Timer 8 secondes

  useEffect(() => {
    if (code && !socket) {
      const codeStr = typeof code === 'string' ? code : (Array.isArray(code) ? code[0] : '');
      setRoomCode(codeStr);
      connectToRoom(codeStr);
    }
  }, [code]);

  // ✅ Timer compte à rebours pour le joueur qui a buzzé
  useEffect(() => {
    if (answerTimer > 0) {
      const interval = setInterval(() => {
        setAnswerTimer(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [answerTimer]);

  const connectToRoom = (roomCodeToJoin) => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('✅ Display connecté au serveur');

      // Rejoindre en tant que display
      newSocket.emit('join_as_display', { roomCode: roomCodeToJoin.toUpperCase() }, (response) => {
        if (response && response.success) {
          setConnected(true);
          setPlayers(response.players || []);
          console.log('📺 Display rejoint la room:', roomCodeToJoin);
        } else {
          console.error('❌ Erreur connexion display:', response?.error);
          alert('Erreur : ' + (response?.error || 'Impossible de rejoindre'));
        }
      });
    });

    // Gestion des joueurs
    newSocket.on('player_joined', (data) => {
      console.log('👤 Joueur rejoint:', data);
      setPlayers(data.players);
    });

    newSocket.on('player_left', (data) => {
      console.log('👋 Joueur parti:', data);
      setPlayers(data.players);
    });

    // Gestion du jeu
    newSocket.on('round_started', (data) => {
      console.log('🎵 Manche lancée');
      setGameState('playing');
      setBuzzedPlayer(null);
      setLastResult(null);
      setAnswerTimer(0);
    });

    newSocket.on('display_track', (data) => {
      console.log('🎵 Track info:', data);
      setCurrentTrack(data);
    });

    newSocket.on('buzz_locked', (data) => {
      console.log('⚡ Buzzer:', data);
      setBuzzedPlayer(data);
      setGameState('buzzed');

      // ✅ Démarrer le timer de 8 secondes
      setAnswerTimer(8);
    });

    // ✅ Événement timeout_warning
    newSocket.on('timeout_warning', (data) => {
      console.log('⚠️ Warning: 4 secondes restantes');
      if (SOUND_VARIATIONS.timeout > 0) {
        playFeedbackSound(false, true); // Jouer le son de warning
      }
    });

    newSocket.on('round_result', (data) => {
      console.log('✅ Résultat:', data);
      setLastResult(data);
      setGameState('result');
      setPlayers(data.leaderboard);
      setAnswerTimer(0);

      // ✅ JOUER LE SON sur le Display
      playFeedbackSound(data.isCorrect, data.isTimeout);

      // ✅ Retour à l'attente après 5 secondes (animation de fin)
      setTimeout(() => {
        setGameState('waiting');
        setBuzzedPlayer(null);
        setCurrentTrack(null);
        setLastResult(null);
      }, 5000);
    });

    // ✅ ÉCOUTER wrong_answer_continue (mauvaise réponse, jeu continue)
    newSocket.on('wrong_answer_continue', (data) => {
      console.log('❌ Mauvaise réponse, jeu continue:', data);

      // ✅ JOUER LE SON de mauvaise réponse
      playFeedbackSound(false, false);

      // Réinitialiser pour permettre aux autres de buzzer
      setGameState('playing');
      setBuzzedPlayer(null);
      setAnswerTimer(0);
    });

    // ✅ ÉCOUTER timeout_continue (timeout 8s, jeu continue)
    newSocket.on('timeout_continue', (data) => {
      console.log('⏱️ Timeout, jeu continue:', data);

      // ✅ JOUER LE SON de timeout
      playFeedbackSound(false, true); // isTimeout = true

      // Réinitialiser pour permettre aux autres de buzzer
      setGameState('playing');
      setBuzzedPlayer(null);
      setAnswerTimer(0);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Display déconnecté');
      setConnected(false);
    });

    setSocket(newSocket);
  };

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('🧹 Nettoyage socket Display');
        socket.close();
      }
    };
  }, [socket]);

  const handleConnect = () => {
    if (roomCode) {
      const codeStr = typeof roomCode === 'string' ? roomCode : roomCode[0] || '';
      router.push('/display?code=' + codeStr.toUpperCase());
    }
  };

  // Écran de connexion
  if (!connected) {
    return (
      <div className={styles.container}>
        <div className={styles.connectScreen}>
          <h1>📺 Affichage TV</h1>
          <p>Entre le code de la partie</p>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={4}
            className={styles.codeInput}
          />
          <button onClick={handleConnect} className={styles.connectButton}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const joinUrl = typeof window !== 'undefined' ? window.location.origin + '/player?code=' + roomCode : '';

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>🎵 Blind Test</div>
        <div className={styles.roomCode}>CODE: {roomCode}</div>
        <div className={styles.status}>
          <span className={styles.statusDot}></span>
          {players.length} joueurs
        </div>
      </header>

      <div className={styles.mainLayout}>
        {/* Zone principale */}
        <div className={styles.mainZone}>

          {/* État: Attente */}
          {gameState === 'waiting' && (
            <div className={styles.waitingState}>
              <h1>🎵 En attente</h1>
              <div className={styles.qrSection}>
                <p>Scanne le QR code pour rejoindre</p>
                {joinUrl && (
                  <div className={styles.qrCode}>
                    <QRCode value={joinUrl} size={300} />
                  </div>
                )}
                <p className={styles.urlText}>{joinUrl}</p>
              </div>
            </div>
          )}

          {/* État: Manche en cours */}
          {gameState === 'playing' && (
            <div className={styles.playingState}>
              <h1>🎵 Manche en cours</h1>
              <div className={styles.audioVisualizer}>
                <div className={styles.soundWaves}>
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={styles.wave}></div>
                  ))}
                </div>
              </div>
              <p className={styles.instruction}>Écoute bien et buzze !</p>
            </div>
          )}

          {/* État: Quelqu'un a buzzé */}
          {gameState === 'buzzed' && buzzedPlayer && (
            <div className={styles.buzzedState}>
              <h1>⚡ BUZZER !</h1>

              {/* ✅ TIMER 8 SECONDES */}
              {answerTimer > 0 && (
                <div className={styles.answerTimerBig}>
                  <div className={styles.timerCircleBig}>
                    <span className={styles.timerValueBig}>{answerTimer}</span>
                  </div>
                  <p className={styles.timerLabelBig}>secondes</p>
                </div>
              )}

              <div className={styles.buzzedPlayer}>
                <div className={styles.playerAvatar} style={{
                  background: buzzedPlayer.color || '#FF3366'
                }}>
                  🎤
                </div>
                <h2>{buzzedPlayer.playerName}</h2>
                <p>a buzzé en premier !</p>
              </div>
            </div>
          )}

          {/* État: Résultat - ✅ ANIMATION DE FIN */}
          {gameState === 'result' && lastResult && (
            <div className={`${styles.resultState} ${lastResult.isCorrect ? styles.correct : styles.wrong}`}>
              <h1>
                {lastResult.noWinner ? '⏱️ TEMPS ÉCOULÉ !' :
                 lastResult.isCorrect ? '✅ BONNE RÉPONSE !' : '❌ MAUVAISE RÉPONSE'}
                {lastResult.isTimeout && !lastResult.noWinner && ' ⏱️'}
              </h1>
              <div className={styles.trackReveal}>
                <div className={styles.trackCover}>🎵</div>
                <div className={styles.trackInfo}>
                  <h2>{lastResult.correctAnswer.title}</h2>
                  <p>{lastResult.correctAnswer.artist}</p>
                </div>
              </div>
              {!lastResult.noWinner && (
                <div className={styles.scoreUpdate}>
                  <p>
                    <strong>{lastResult.playerName}</strong>
                    {lastResult.isCorrect ? ' +' : ' '}
                    {lastResult.points} pts
                    {lastResult.isTimeout && ' (Temps écoulé)'}
                  </p>
                </div>
              )}
              {lastResult.noWinner && (
                <div className={styles.scoreUpdate}>
                  <p>Personne n'a trouvé la bonne réponse !</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar joueurs */}
        <aside className={styles.sidebar}>
          <h3>🏆 Classement</h3>
          <div className={styles.playerList}>
            {players.length === 0 && (
              <p className={styles.noPlayers}>Aucun joueur pour le moment</p>
            )}
            {players.map((player, index) => (
              <div
                key={player.name}
                className={`${styles.playerItem} ${index === 0 ? styles.first : ''}`}
              >
                <span className={styles.rank}>
                  {index + 1 === 1 && '🥇'}
                  {index + 1 === 2 && '🥈'}
                  {index + 1 === 3 && '🥉'}
                  {index + 1 > 3 && (index + 1)}
                </span>
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.playerScore}>{player.score}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
