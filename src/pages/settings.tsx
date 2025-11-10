import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/GameSettings.module.css';

export default function GameSettings() {
  const router = useRouter();

  const [gameMode, setGameMode] = useState('classic');
  const [roundCount, setRoundCount] = useState(10);
  const [extractDuration, setExtractDuration] = useState(30);
  const [soundVolume, setSoundVolume] = useState(60);
  const [autoStart, setAutoStart] = useState(false);
  const [countdownDelay, setCountdownDelay] = useState(10);

  const handleCreateGame = () => {
    // Sauvegarder les paramètres et créer la partie
    const settings = {
      gameMode,
      roundCount,
      extractDuration,
      soundVolume,
      autoStart,
      countdownDelay
    };

    // Stocker dans sessionStorage ou passer en paramètre
    sessionStorage.setItem('gameSettings', JSON.stringify(settings));

    // Rediriger vers l'interface hôte
    router.push('/host');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          ← Retour
        </button>
        <h1 className={styles.title}>⚙️ Paramètres de partie</h1>
      </header>

      <main className={styles.mainContent}>

        {/* Mode de jeu */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🎮 Mode de jeu</h2>
          <div className={styles.optionsGrid}>
            <label className={`${styles.modeCard} ${gameMode === 'classic' ? styles.modeCardActive : ''}`}>
              <input
                type="radio"
                name="gameMode"
                value="classic"
                checked={gameMode === 'classic'}
                onChange={(e) => setGameMode(e.target.value)}
                className={styles.radioHidden}
              />
              <div className={styles.modeIcon}>🎵</div>
              <div className={styles.modeTitle}>Classique</div>
              <div className={styles.modeDescription}>
                Validation manuelle par l'hôte
              </div>
            </label>

            <label className={`${styles.modeCard} ${gameMode === 'auto' ? styles.modeCardActive : ''}`}>
              <input
                type="radio"
                name="gameMode"
                value="auto"
                checked={gameMode === 'auto'}
                onChange={(e) => setGameMode(e.target.value)}
                className={styles.radioHidden}
              />
              <div className={styles.modeIcon}>🤖</div>
              <div className={styles.modeTitle}>Auto</div>
              <div className={styles.modeDescription}>
                Lancement automatique avec décompte
              </div>
            </label>

            <label className={`${styles.modeCard} ${gameMode === 'qcm' ? styles.modeCardActive : ''}`}>
              <input
                type="radio"
                name="gameMode"
                value="qcm"
                checked={gameMode === 'qcm'}
                onChange={(e) => setGameMode(e.target.value)}
                className={styles.radioHidden}
              />
              <div className={styles.modeIcon}>🎯</div>
              <div className={styles.modeTitle}>QCM</div>
              <div className={styles.modeDescription}>
                4 choix, validation automatique
              </div>
            </label>

            <label className={`${styles.modeCard} ${gameMode === 'free' ? styles.modeCardActive : ''}`}>
              <input
                type="radio"
                name="gameMode"
                value="free"
                checked={gameMode === 'free'}
                onChange={(e) => setGameMode(e.target.value)}
                className={styles.radioHidden}
              />
              <div className={styles.modeIcon}>⌨️</div>
              <div className={styles.modeTitle}>Saisie libre</div>
              <div className={styles.modeDescription}>
                Le joueur tape la réponse
              </div>
            </label>
          </div>
        </div>

        {/* Paramètres de manche */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🎲 Paramètres des manches</h2>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              Nombre de manches
              <span className={styles.settingValue}>{roundCount}</span>
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={roundCount}
              onChange={(e) => setRoundCount(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderMarkers}>
              <span>5</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              Durée des extraits
              <span className={styles.settingValue}>{extractDuration}s</span>
            </label>
            <input
              type="range"
              min="10"
              max="30"
              step="5"
              value={extractDuration}
              onChange={(e) => setExtractDuration(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderMarkers}>
              <span>10s</span>
              <span>20s</span>
              <span>30s</span>
            </div>
          </div>
        </div>

        {/* Paramètres audio */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🔊 Audio</h2>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              Volume des effets sonores
              <span className={styles.settingValue}>{soundVolume}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderMarkers}>
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Options avancées */}
        {(gameMode === 'auto' || gameMode === 'qcm' || gameMode === 'free') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>⚡ Options avancées</h2>

            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
                className={styles.checkbox}
              />
              <div className={styles.checkboxLabel}>
                <div className={styles.checkboxTitle}>Lancement automatique</div>
                <div className={styles.checkboxDescription}>
                  Les manches se lancent automatiquement
                </div>
              </div>
            </label>

            {autoStart && (
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  Décompte entre manches
                  <span className={styles.settingValue}>{countdownDelay}s</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={countdownDelay}
                  onChange={(e) => setCountdownDelay(parseInt(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderMarkers}>
                  <span>5s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Résumé */}
        <div className={`${styles.section} ${styles.summary}`}>
          <h2 className={styles.sectionTitle}>📋 Résumé</h2>
          <ul className={styles.summaryList}>
            <li>
              Mode : <strong>
                {gameMode === 'classic' && 'Classique'}
                {gameMode === 'auto' && 'Auto'}
                {gameMode === 'qcm' && 'QCM'}
                {gameMode === 'free' && 'Saisie libre'}
              </strong>
            </li>
            <li>{roundCount} manches de {extractDuration} secondes</li>
            <li>Volume effets : {soundVolume}%</li>
            {autoStart && <li>Lancement auto avec décompte de {countdownDelay}s</li>}
          </ul>
        </div>

      </main>

      {/* Footer avec bouton de création */}
      <footer className={styles.footer}>
        <button onClick={handleCreateGame} className={styles.createButton}>
          ✓ Créer la partie
        </button>
      </footer>
    </div>
  );
}
