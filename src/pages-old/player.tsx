import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import styles from '../styles/Player.module.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Configuration des variations de sons
const SOUND_VARIATIONS = {
  correct: 2,   // 2 variations pour les bonnes réponses
  wrong: 2,     // 2 variations pour les mauvaises réponses
  timeout: 1    // 1 variation pour le timeout (activé maintenant)
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

    console.log('🔊 Lecture son:', soundFile);

    const audio = new Audio(soundFile);
    audio.volume = 0.8;
    audio.play().catch(err => {
      console.error('Erreur lecture son feedback:', err);
    });
  } catch (error) {
    console.error('Erreur chargement son feedback:', error);
  }
};

export default function Player() {
  const router = useRouter();
  const { code } = router.query;

  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState(
    typeof code === 'string' ? code : (Array.isArray(code) ? code[0] : '') || ''
  );
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [canBuzz, setCanBuzz] = useState(false);
  const [buzzedPlayer, setBuzzedPlayer] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myBuzzerSound, setMyBuzzerSound] = useState(null);
  const myBuzzerSoundRef = useRef(null); // 🆕 Ajoute un ref
  const [roundNumber, setRoundNumber] = useState(0);
  const [answerTimer, setAnswerTimer] = useState(0); // Timer 8 secondes

  useEffect(() => {
    if (code) {
      const codeStr = typeof code === 'string' ? code : (Array.isArray(code) ? code[0] : '');
      setRoomCode(codeStr);
    }
  }, [code]);

  // ✅ Timer compte à rebours
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

  const handleJoin = () => {
    if (!roomCode || !playerName) {
      alert('Veuillez renseigner le code et votre pseudo');
      return;
    }

    console.log('👤 Tentative de rejoindre:', roomCode);
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('✅ Connecté au serveur avec ID:', newSocket.id);

      newSocket.emit('join_game', { roomCode: roomCode.toUpperCase(), playerName }, (response) => {
        console.log('📥 Réponse join_game:', response);
        console.log('🔊 Buzzer son:', response.buzzerSound);

        if (response.success) {
          console.log('✅ Rejoint avec succès !');
          console.log('🔊 Son de buzzer attribué: #' + response.buzzerSound);

          setJoined(true);
          setSocket(newSocket);
          setMyBuzzerSound(response.buzzerSound);
          myBuzzerSoundRef.current = response.buzzerSound; // 🆕 Stocke aussi dans ref

          newSocket.on('round_started', (data) => {
            console.log('🎵 Manche démarrée !', data);
            setGameStatus('playing');
            setCanBuzz(true);
            setLastResult(null);
            setBuzzedPlayer('');
            setAnswerTimer(0);
            setRoundNumber(prev => prev + 1);
          });

          newSocket.on('buzz_locked', (data) => {
            console.log('⚡ Buzzer verrouillé:', data.playerName);
            setCanBuzz(false);
            setBuzzedPlayer(data.playerName);
            setGameStatus('locked');

            // ✅ Démarrer le timer de 8 secondes
            setAnswerTimer(8);

                    // ✅ CORRECTION : Utiliser la ref
           if (data.playerName === playerName && myBuzzerSoundRef.current) {
             console.log('🔊 Jouer buzzer #' + myBuzzerSoundRef.current);
             playBuzzerSound(myBuzzerSoundRef.current);
           }
         });

          // ✅ Événement timeout_warning
          newSocket.on('timeout_warning', (data) => {
            console.log('⚠️ Warning: 4 secondes restantes');
            if (SOUND_VARIATIONS.timeout > 0) {
              playFeedbackSound(false, true); // Jouer le son de warning
            }
          });

          newSocket.on('round_result', (data) => {
            console.log('📊 Résultat de la manche:', data);
            setLastResult(data);
            setGameStatus('waiting');
            setBuzzedPlayer('');
            setAnswerTimer(0);

            // ✅ CORRECTION : Utiliser data.player.name
  if (data.player && data.player.name === playerName) {
    console.log('🔊 Je joue le son feedback');
    playFeedbackSound(data.correct, false);  // data.correct pas data.isCorrect
  }

  const myPlayer = data.leaderboard.find(p => p.name === playerName);
  if (myPlayer) {
    setMyScore(myPlayer.score);
  }
});

          // ✅ ÉCOUTER wrong_answer_continue (mauvaise réponse, jeu continue)
          newSocket.on('wrong_answer_continue', (data) => {
            console.log('❌ Mauvaise réponse, jeu continue:', data);

            // ✅ JOUER LE SON si c'est moi qui ai mal répondu
            if (data.playerName === playerName) {
              playFeedbackSound(false, false); // false = mauvaise réponse
            }

            // Réactiver le buzzer pour tout le monde
            setGameStatus('playing');
            setCanBuzz(true);
            setBuzzedPlayer('');
            setAnswerTimer(0);

            // Mettre à jour mon score si c'est moi
            if (data.playerName === playerName) {
              setMyScore(prev => prev + data.points);
            }
          });

          // ✅ ÉCOUTER timeout_continue (timeout 8s, jeu continue)
          newSocket.on('timeout_continue', (data) => {
            console.log('⏱️ Timeout, jeu continue:', data);

            // ✅ JOUER LE SON si c'est moi qui ai timeout
            if (data.playerName === playerName) {
              playFeedbackSound(false, true); // isTimeout = true
            }

            // Réactiver le buzzer pour tout le monde
            setGameStatus('playing');
            setCanBuzz(true);
            setBuzzedPlayer('');
            setAnswerTimer(0);

            // Mettre à jour mon score si c'est moi
            if (data.playerName === playerName) {
              setMyScore(prev => prev + data.points);
            }
          });

          newSocket.on('game_ended', () => {
            alert('La partie a été fermée par l\'hôte');
            router.push('/');
          });

        } else {
          alert('Erreur : ' + response.error);
          newSocket.close();
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur');
    });

    // Cleanup des listeners
    return () => {
      newSocket.off('round_started');
      newSocket.off('buzz_locked');
      newSocket.off('timeout_warning');
      newSocket.off('round_result');
      newSocket.off('wrong_answer_continue');
      newSocket.off('timeout_continue');
      newSocket.off('game_ended');
    };
  };

  // ✅ FONCTION POUR JOUER LE SON DU BUZZER
  const playBuzzerSound = (soundNumber) => {
    try {
      // 🆕 CORRECTION: Utiliser buzzer_1.mp3 (underscore)
      const audio = new Audio(`/sounds/buzzer_${soundNumber}.mp3`);
      audio.volume = 0.8;
      audio.play().catch(err => {
        console.error('Erreur lecture son buzzer:', err);
        console.error('Chemin tenté:', `/sounds/buzzer_${soundNumber}.mp3`);
      });
    } catch (error) {
      console.error('Erreur chargement son buzzer:', error);
    }
  };

  const handleBuzz = () => {
    if (!socket || !canBuzz) return;

    console.log('⚡ BUZZ !');
    socket.emit('buzz', { roomCode });
    setCanBuzz(false);

    // Vibration mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  };

  if (!joined) {
    return (
      <div className={styles.container}>
        <div className={styles.joinScreen}>
          <div className={styles.joinLogo}>🎵</div>
          <h1 className={styles.joinTitle}>Blind Test</h1>
          <p className={styles.joinSubtitle}>Rejoindre une partie</p>

          <div className={styles.joinForm}>
            <input
              type="text"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className={styles.codeInput}
              maxLength={4}
            />

            <input
              type="text"
              placeholder="TON PSEUDO"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className={styles.nameInput}
              maxLength={20}
            />

            <button onClick={handleJoin} className={styles.joinButton}>
              Rejoindre la partie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.playerContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>🎵 Blind Test</div>
        <div className={styles.headerInfo}>Manche {roundNumber}</div>
      </header>

      {/* Main zone */}
      <div className={styles.mainZone}>

        {/* État: Attente */}
        {gameStatus === 'waiting' && (
          <div className={styles.waitingState}>
            <div className={styles.stateIcon}>⏳</div>
            <h2 className={styles.stateTitle}>En attente...</h2>
            <p className={styles.stateText}>
              L'hôte va lancer la prochaine manche
            </p>

            {lastResult && (
              <div className={`${styles.resultCard} ${lastResult.correct ? styles.resultCorrect : styles.resultWrong}`}>
                <div className={styles.resultTitle}>
                  {lastResult.correct ? '✅ Bonne réponse !' : '❌ Mauvaise réponse'}
                </div>
                <div className={styles.trackReveal}>
                  <div className={styles.trackName}>{lastResult.answer}</div>
                </div>
                <div className={styles.resultPlayer}>
                  {lastResult.player && (
                    <>
                      Par <strong>{lastResult.player.name}</strong>
                      {lastResult.points > 0 ? ' +' : ' '}
                      {lastResult.points} pts
                    </>
                  )}
                  {!lastResult.player && lastResult.message && (
                    <>{lastResult.message}</>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* État: Buzzer actif */}
        {gameStatus === 'playing' && (
          <div className={styles.buzzerContainer}>
            <div className={styles.timerDisplay}>🎵 Écoute bien...</div>
            <button
              onClick={handleBuzz}
              className={`${styles.buzzer} ${!canBuzz ? styles.buzzerDisabled : ''}`}
              disabled={!canBuzz}
            >
              <div className={styles.buzzerText}>
                {canBuzz ? '⚡ BUZZER' : '⏳'}
              </div>
            </button>
            <div className={styles.instructionText}>
              {canBuzz ? 'Appuie dès que tu connais !' : 'Attente...'}
            </div>
          </div>
        )}

        {/* État: Buzzer verrouillé */}
        {gameStatus === 'locked' && (
          <div className={styles.lockedState}>
            <div className={styles.stateIcon}>⏸️</div>

            {/* ✅ TIMER 8 SECONDES */}
            {answerTimer > 0 && (
              <div className={styles.answerTimer}>
                <div className={styles.timerCircle}>
                  <span className={styles.timerValue}>{answerTimer}</span>
                </div>
                <p className={styles.timerLabel}>secondes pour répondre</p>
              </div>
            )}

            <h2 className={styles.stateTitle}>Buzzer verrouillé</h2>
            <div className={styles.buzzedPlayerName}>
              <strong>{buzzedPlayer}</strong>
            </div>
            <p className={styles.stateText}>
              {buzzedPlayer === playerName ? 'C\'est à toi de répondre !' : 'répond...'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.playerInfo}>
          <div className={styles.playerName}>{playerName}</div>
          {myBuzzerSound && (
            <div className={styles.buzzerNumber}>🔊 Buzzer #{myBuzzerSound}</div>
          )}
        </div>
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreLabel}>Score</div>
          <div className={styles.scoreValue}>{myScore} pts</div>
        </div>
      </footer>
    </div>
  );
}
