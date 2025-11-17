import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          🎵 <span className={styles.gradient}>Blind Test</span>
        </h1>
        <p className={styles.subtitle}>
          Joue entre amis en temps réel
        </p>
      </div>

      <div className={styles.buttonGrid}>
        <button
          className={`${styles.btn} ${styles.btnHost}`}
          onClick={() => router.push('/host-control')}
        >
          <div className={styles.btnIcon}>🎬</div>
          <div className={styles.btnTitle}>Créer une partie</div>
          <div className={styles.btnDesc}>Je suis le maître de cérémonie</div>
        </button>

        <button
          className={`${styles.btn} ${styles.btnDisplay}`}
          onClick={() => router.push('/display')}
        >
          <div className={styles.btnIcon}>📺</div>
          <div className={styles.btnTitle}>Affichage TV</div>
          <div className={styles.btnDesc}>Écran pour tout le monde</div>
        </button>

        <button
          className={`${styles.btn} ${styles.btnPlayer}`}
          onClick={() => router.push('/player')}
        >
          <div className={styles.btnIcon}>🎮</div>
          <div className={styles.btnTitle}>Rejoindre</div>
          <div className={styles.btnDesc}>Je suis un joueur</div>
        </button>
      </div>

      <footer className={styles.footer}>
        <p>Créé avec ❤️ pour des soirées inoubliables</p>
      </footer>
    </div>
  );
}
