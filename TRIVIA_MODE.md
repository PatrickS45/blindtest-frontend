# Mode TRIVIA - Documentation Frontend

Ce document décrit l'implémentation du mode TRIVIA dans le frontend de l'application Blind Test.

## 📋 Vue d'ensemble

Le mode **TRIVIA** est un mode de jeu **QCM avec timer**. Contrairement aux modes musicaux qui utilisent un système de buzz, le mode TRIVIA permet à tous les joueurs de répondre simultanément à des questions à choix multiples dans un temps limité.

### Caractéristiques principales

- ✅ Questions à choix multiples (4 options : A, B, C, D)
- ⏱️ Timer configurable (par défaut 20 secondes)
- 🎯 Validation automatique à la fin du timer
- 📊 Affichage des résultats et statistiques
- 🎨 Interface dédiée pour display et joueurs
- 🔊 Effets sonores immersifs
- 📱 Support mobile avec vibrations

## 🏗️ Architecture

### Types TypeScript (`src/types/game.ts`)

```typescript
// Mode ajouté
export type GameMode = 'accumul_points' | 'reflexoquiz' | 'qcm' |
                       'questions_rafale' | 'chaud_devant' | 'tueurs_gages' | 'trivia'

// Structures pour les questions TRIVIA
export interface TriviaQuestion {
  type: 'trivia'
  question: string
  options: TriviaOption[]
  category?: string
  difficulty?: string
  source?: string
  timeout: number
}

export interface TriviaOption {
  text: string
  correct: boolean
}

export interface TriviaResult {
  results: TriviaPlayerAnswer[]
  correctAnswer: string
  correctOption: string
  leaderboard: Player[]
  teamLeaderboard?: Team[]
}
```

### Événements Socket.IO (`src/types/socket-events.ts`)

#### Client → Serveur

```typescript
// Charger les questions
load_trivia_questions: (data: {
  roomCode: string
  provider?: string
  category?: string
  difficulty?: string
})

// Obtenir les catégories disponibles
get_trivia_categories: (data: { provider?: string })

// Obtenir les providers disponibles
get_trivia_providers: (data: {})

// Soumettre une réponse
submit_qcm_answer: (data: {
  roomCode: string
  optionIndex: number
  timestamp: number
})

// Valider les réponses (Host)
validate_qcm: (data: { roomCode: string })
```

#### Serveur → Client

```typescript
// Questions chargées
trivia_loaded: (data: {
  questionCount: number
  category?: string
  difficulty?: string
  provider?: string
})

// Début de round avec question
round_started: (data: {
  round: RoundData
  mode: 'trivia'
})

// Résultats de la question
qcm_result: (data: TriviaResult)

// Countdown (optionnel)
countdown_tick: (data: { timeRemaining: number })
countdown_end: ()
```

## 🎮 Composants

### 1. TriviaQuestion (`src/components/game/TriviaQuestion.tsx`)

Composant pour le display TV - affiche la question, les options, le timer et les résultats.

**Props:**
```typescript
{
  question: string
  options: TriviaOption[]
  category?: string
  difficulty?: string
  roundNumber: number
  totalRounds: number
  timeRemaining: number
  initialTime: number
  showResults?: boolean
  correctAnswer?: string
  playerAnswers?: Record<string, number>
}
```

**Fonctionnalités:**
- Timer visuel circulaire avec barre de progression
- Affichage des 4 options avec badges colorés (A, B, C, D)
- Animation d'urgence à 5 secondes restantes
- Révélation de la bonne réponse avec animation
- Statistiques de réponses (pourcentage par option)

### 2. TriviaPlayerView (`src/components/game/TriviaPlayerView.tsx`)

Composant pour l'écran mobile des joueurs - interface de réponse tactile.

**Props:**
```typescript
{
  question: string
  options: TriviaOption[]
  timeRemaining: number
  initialTime: number
  onAnswer: (optionIndex: number) => void
  selectedOption: number | null
  showResults?: boolean
  myResult?: {
    isCorrect: boolean
    pointsAwarded: number
    newScore: number
  }
  disabled?: boolean
}
```

**Fonctionnalités:**
- Boutons tactiles avec feedback visuel
- Timer synchronisé avec le display
- Confirmation visuelle de la réponse enregistrée
- Feedback vibration sur sélection et résultats
- Affichage des points gagnés/perdus

### 3. SoundManager (`src/utils/SoundManager.ts`)

Gestionnaire de sons pour le mode TRIVIA.

**API:**
```typescript
const soundManager = getSoundManager(80) // volume 0-100

// Jouer un son
soundManager.play('countdown')
soundManager.play('countdownUrgent')
soundManager.play('timeUp')
soundManager.play('correct')
soundManager.play('wrong')
soundManager.play('reveal')
soundManager.play('nextQuestion')

// Contrôle
soundManager.setVolume(50)
soundManager.setEnabled(false)
soundManager.stopAll()
```

**Sons utilisés:**
- `countdown.mp3` - Tick-tock pendant le timer (optionnel)
- `countdown_urgent.mp3` - 5 dernières secondes
- `time_up.mp3` - Fin du temps
- `correct.mp3` - Bonne réponse (existant)
- `wrong.mp3` - Mauvaise réponse (existant)
- `reveal.mp3` - Révélation de la réponse
- `next_question.mp3` - Transition

## 📱 Flow du jeu

### 1. Chargement des questions

Le host charge les questions via l'API ou un provider custom :

```typescript
socket.emit('load_trivia_questions', {
  roomCode: 'ABCD',
  provider: 'trivia',
  category: 'histoire',
  difficulty: 'facile'
})

// Confirmation
socket.on('trivia_loaded', (data) => {
  console.log(`${data.questionCount} questions chargées`)
})
```

### 2. Début de round

Le serveur envoie la question à tous les clients :

```typescript
socket.on('round_started', (data) => {
  if (data.mode === 'trivia' && data.round?.qcm?.type === 'trivia') {
    // Afficher la question
    setTriviaQuestion(data.round.qcm)
    // Démarrer le countdown
    startCountdown(data.round.qcm.timeout)
  }
})
```

**Display:** Affiche `<TriviaQuestion>` avec le timer
**Player:** Affiche `<TriviaPlayerView>` avec les boutons de réponse

### 3. Réponse des joueurs

Les joueurs sélectionnent une option avant la fin du timer :

```typescript
const handleTriviaAnswer = (optionIndex: number) => {
  socket.emit('submit_qcm_answer', {
    roomCode,
    optionIndex,
    timestamp: Date.now()
  })

  setTriviaSelectedOption(optionIndex)
  // Feedback : "Réponse enregistrée ✓"
}
```

**États:**
- Option non sélectionnée : bordure grise
- Option sélectionnée : bordure colorée + scale 105%
- Boutons désactivés après sélection

### 4. Fin du timer et validation

Lorsque le timer atteint 0 :

```typescript
// Frontend
if (timeRemaining <= 0) {
  soundManager.play('timeUp')
  // Le serveur valide automatiquement
}
```

**Le serveur peut aussi déclencher la validation manuellement :**
```typescript
socket.emit('validate_qcm', { roomCode })
```

### 5. Affichage des résultats

Tous les clients reçoivent les résultats :

```typescript
socket.on('qcm_result', (data) => {
  // Display
  setTriviaResults(data)
  soundManager.play('reveal')

  // Afficher la bonne réponse
  // Afficher les statistiques
  // Jouer les sons correct/wrong pour chaque joueur

  // Player
  const myResult = data.results.find(r => r.playerName === playerName)
  setTriviaMyResult(myResult)

  if (myResult.isCorrect) {
    soundManager.play('correct')
    vibrate([50, 50, 50]) // Vibration joyeuse
  } else {
    soundManager.play('wrong')
    vibrate([200]) // Vibration triste
  }
})
```

**Format des résultats:**

```typescript
{
  results: [
    {
      playerId: 'player1',
      playerName: 'Alice',
      answer: 'Paris',
      isCorrect: true,
      pointsAwarded: 10,
      newScore: 50
    },
    // ...
  ],
  correctAnswer: 'Paris',
  correctOption: 'Paris',
  leaderboard: [...],
  teamLeaderboard: [...]
}
```

### 6. Transition

Après 8 secondes d'affichage des résultats :

```typescript
setTimeout(() => {
  setGameStatus('waiting')
  setTriviaQuestion(null)
  setTriviaResults(null)
}, 8000)
```

**Display:** Retour à l'état "waiting"
**Player:** Affiche `<TriviaWaiting>` avec animation

## 🎨 Styles et animations

### Couleurs des options

```typescript
const OPTION_COLORS = {
  A: '#4A90E2', // Blue
  B: '#F5A623', // Orange
  C: '#7B68EE', // Purple
  D: '#50E3C2', // Teal
}
```

### Animations principales

- **Timer urgent** (≤ 5s) : `animate-pulse` + couleur rouge
- **Bonne réponse** : `animate-pulse` + confettis
- **Mauvaise réponse** : `animate-shake`
- **Sélection** : `scale-105`
- **Badge option** : `scale-125` quand correct

### Classes Tailwind utilisées

```css
/* Timer */
.animate-pulse        /* Urgence */
.transition-all       /* Smooth transitions */

/* Révélation réponse */
.bg-success/20        /* Fond vert transparent */
.border-success       /* Bordure verte */
.animate-bounce       /* Badge qui rebondit */

/* Résultats */
.animate-fade-in      /* Apparition douce */
.animate-shake        /* Secousse pour erreur */
```

## 🔧 Configuration

### Timers (dans `src/types/game.ts`)

```typescript
export const TIMERS = {
  TRIVIA_TIMEOUT: 20000,   // 20 secondes par défaut
  TRIVIA_WARNING: 5000,    // Alerte à 5 secondes
}
```

### Points (dans `src/types/game.ts`)

```typescript
export const POINTS = {
  TRIVIA_CORRECT: 10,  // Points pour bonne réponse
  TRIVIA_WRONG: -3,    // Points perdus pour mauvaise réponse
}
```

## 📊 États de jeu

### Display (`src/app/display/[roomCode]/page.tsx`)

```typescript
gameStatus: 'waiting' | 'playing' | 'buzzed' | 'result' | 'finished' | 'trivia'

// TRIVIA-specific
triviaQuestion: TriviaQuestion | null
triviaResults: TriviaResult | null
triviaTimeRemaining: number
playerAnswers: Record<string, number> // Stats par option
```

### Player (`src/app/player/[roomCode]/page.tsx`)

```typescript
gameStatus: 'waiting' | 'playing' | 'locked' | 'trivia'

// TRIVIA-specific
triviaQuestion: TriviaQuestion | null
triviaSelectedOption: number | null
triviaTimeRemaining: number
triviaMyResult: { isCorrect, pointsAwarded, newScore } | null
```

## 🐛 Debugging

### Logs importants

```typescript
// Round started
console.log('🤔 [TRIVIA] Round started with question:', data.round.qcm)

// Answer submitted
console.log('📝 [TRIVIA] Submitting answer:', optionIndex)

// Results received
console.log('📊 [TRIVIA] QCM Results received:', data)
```

### Vérifications

1. ✅ Le mode est bien détecté : `data.mode === 'trivia'`
2. ✅ La question a le bon type : `data.round?.qcm?.type === 'trivia'`
3. ✅ Le timer démarre correctement
4. ✅ Les réponses sont envoyées avec le bon format
5. ✅ Les résultats sont bien reçus et affichés

## 🚀 Optimisations

### Performance

- Timer côté client (pas de sync serveur sauf option)
- Préchargement des sons via `soundManager.preload()`
- Désactivation auto des boutons après sélection
- Cleanup des timers dans useEffect

### UX Mobile

- Retour haptique (vibrations) sur interaction
- `touch-action-manipulation` pour éviter le zoom
- Boutons tactiles de taille optimale (min 44x44px)
- Feedback visuel immédiat

## 📝 Notes

- **Pas de musique** en mode TRIVIA (contrairement aux autres modes)
- **Timer côté client** pour meilleure réactivité
- **Validation automatique** ou manuelle par le host
- **Support mode équipe** via `teamLeaderboard`
- **Sons partagés** : `correct.mp3` et `wrong.mp3` avec les autres modes

## 🎯 Checklist d'implémentation

- [x] Types TypeScript pour TRIVIA
- [x] Événements Socket.IO
- [x] Composant TriviaQuestion (display)
- [x] Composant TriviaPlayerView (mobile)
- [x] SoundManager avec sons TRIVIA
- [x] Intégration dans page display
- [x] Intégration dans page player
- [x] Gestion du countdown
- [x] Affichage des résultats
- [x] Animations et effets visuels
- [x] Support vibrations mobile
- [ ] Tests end-to-end
- [ ] Ajout des fichiers audio manquants

## 📚 Ressources

- **Guide backend** : `TRIVIA_INTEGRATION.md`
- **Types** : `src/types/game.ts`, `src/types/socket-events.ts`
- **Composants** : `src/components/game/Trivia*.tsx`
- **Sons** : `public/sounds/trivia/README.md`

---

**Version:** 1.0
**Dernière mise à jour:** 2025-12-23
