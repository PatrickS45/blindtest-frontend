# Guide d'Implémentation - Modes 4, 5 et 6

Ce document fournit un guide détaillé pour implémenter les 3 derniers modes de jeu du Blind Test.

## 📋 Vue d'ensemble

- ✅ Mode 1 : Accumul' Points (Implémenté)
- ✅ Mode 2 : Réflex-O-Quiz (Composant créé)
- ✅ Mode 3 : QCM Musical (Composant créé)
- ⏳ Mode 4 : Questions en Rafale (À implémenter)
- ⏳ Mode 5 : Chaud Devant (À implémenter)
- ⏳ Mode 6 : Tueurs à Gages (À implémenter)

---

## Mode 4 : Questions en Rafale 🌊

### Concept
Questions progressives avec indices révélés au fil du temps. Plus vous répondez tôt, plus vous gagnez de points.

### Mécanisme
1. La musique démarre
2. Des indices sont révélés toutes les X secondes :
   - **10s** : Genre musical → 100 points
   - **20s** : Année de sortie → 75 points
   - **30s** : Premier mot du titre → 50 points
   - **40s** : Artiste révélé → 25 points

### Composants à créer

#### `src/components/game/HintReveal.tsx`
```tsx
interface Hint {
  time: number       // Temps de révélation (en secondes)
  text: string      // Texte de l'indice
  points: number    // Points si réponse donnée avant prochain indice
  revealed: boolean // État de révélation
}

interface HintRevealProps {
  hints: Hint[]
  currentTime: number
  onAnswer: (timestamp: number) => void
}
```

**Fonctionnalités** :
- Affichage progressif des indices
- Indicateur visuel du temps restant avant prochain indice
- Animation de révélation (fade-in, slide-in)
- Compteur de points en temps réel

#### Modifications Backend nécessaires
```typescript
// Socket events à ajouter
socket.on('hint_revealed', (data: { hintIndex: number, hint: Hint }) => {
  // Révéler un nouvel indice
})

socket.emit('answer_rafale', {
  roomCode: string,
  answer: string,
  timestamp: number
})

socket.on('rafale_result', (data: {
  correct: boolean,
  points: number,
  hintIndex: number
}) => {
  // Résultat avec points basés sur vitesse
})
```

### Modifications Frontend

#### `src/app/player/[roomCode]/page.tsx`
Ajouter un champ de texte pour la réponse :
```tsx
{gameMode === 'questions_rafale' && (
  <div className="space-y-4">
    <HintReveal
      hints={hints}
      currentTime={elapsedTime}
      onAnswer={handleRafaleAnswer}
    />
    <input
      type="text"
      placeholder="Entrez votre réponse..."
      className="w-full px-4 py-3 rounded-xl..."
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSubmitAnswer()
      }}
    />
  </div>
)}
```

#### `src/app/host/control/[roomCode]/page.tsx`
Afficher les indices et les réponses reçues :
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <h3>Indices révélés</h3>
    {hints.filter(h => h.revealed).map(hint => (
      <div key={hint.time}>{hint.text} ({hint.points}pts)</div>
    ))}
  </div>
  <div>
    <h3>Réponses reçues ({answers.length})</h3>
    {answers.map(answer => (
      <div>{answer.playerName} - {answer.timestamp}s</div>
    ))}
  </div>
</div>
```

---

## Mode 5 : Chaud Devant 🔥

### Concept
Mode "bombe à retardement". Les joueurs peuvent buzzer, mais attention : la bombe peut exploser ! Le dernier à buzzer avant l'explosion gagne.

### Mécanisme
1. La musique démarre avec un timer aléatoire (non visible)
2. Les joueurs peuvent buzzer à tout moment
3. Quand la "bombe" explose (timer = 0) :
   - Le **dernier joueur** à avoir buzzé gagne les points
   - Les autres perdent des points

### Composants à créer

#### `src/components/game/BombTimer.tsx`
```tsx
interface BombTimerProps {
  isActive: boolean
  hasBuzzed: boolean
  buzzPosition?: number // Position dans l'ordre des buzzers
  totalBuzzers: number
}
```

**Fonctionnalités** :
- Animation de bombe pulsante 💣
- Sons de tic-tac (audio)
- Explosion visuelle quand temps écoulé
- Indication si le joueur a déjà buzzé

#### Modifications Backend nécessaires
```typescript
// Socket events à ajouter
socket.on('chaud_devant_started', (data: {
  maxDuration: number  // Durée maximale (cachée aux joueurs)
}) => {
  // Démarrer le round
})

socket.emit('chaud_devant_buzz', {
  roomCode: string,
  timestamp: number
})

socket.on('bomb_exploded', (data: {
  winner: { playerId: string, playerName: string },
  allBuzzers: Array<{ playerId: string, timestamp: number }>
}) => {
  // Résultat : le dernier à buzzer gagne
})
```

### Modifications Frontend

#### `src/app/player/[roomCode]/page.tsx`
```tsx
{gameMode === 'chaud_devant' && (
  <div className="flex flex-col items-center gap-8">
    <BombTimer
      isActive={roundActive}
      hasBuzzed={hasBuzzed}
      buzzPosition={myBuzzPosition}
      totalBuzzers={totalBuzzers}
    />
    <Buzzer
      onClick={handleChaudDevantBuzz}
      disabled={!roundActive || hasBuzzed}
      size="xl"
      label={hasBuzzed ? "Buzzé !" : "Buzzer"}
    />
    {hasBuzzed && (
      <p className="text-warning text-center">
        ⚠️ Vous avez buzzé en position #{myBuzzPosition}
        <br />
        Espérons que vous soyez le dernier avant l'explosion !
      </p>
    )}
  </div>
)}
```

#### `src/app/display/[roomCode]/page.tsx`
Animation de la bombe avec liste des joueurs ayant buzzé :
```tsx
<div className="text-center">
  <div className="text-9xl mb-8 animate-pulse">💣</div>
  <h2 className="text-4xl font-bold mb-6">Chaud Devant !</h2>
  <div className="text-2xl mb-4">
    {buzzers.length} joueur{buzzers.length > 1 ? 's' : ''} ont buzzé
  </div>
  <div className="space-y-2">
    {buzzers.map((buzz, index) => (
      <div key={buzz.playerId} className="text-xl">
        #{index + 1} - {buzz.playerName}
      </div>
    ))}
  </div>
</div>
```

---

## Mode 6 : Tueurs à Gages 🎯

### Concept
Chaque joueur se voit attribuer une "cible" (un autre joueur). Si vous buzzez et répondez correctement, vous **volez des points** à votre cible.

### Mécanisme
1. Au début du round, chaque joueur reçoit une cible secrète
2. Si le joueur buzz et répond correctement :
   - Il gagne des points normalement (+10)
   - Il **vole** des points à sa cible (-5 pour la cible)
3. Les cibles changent chaque round

### Composants à créer

#### `src/components/game/TargetIndicator.tsx`
```tsx
interface TargetIndicatorProps {
  targetName: string
  targetColor: string
  targetScore: number
  showTarget: boolean // Afficher ou masquer (pendant le round)
}
```

**Fonctionnalités** :
- Affichage de la cible assignée
- Animation de visée (réticule)
- Indicateur de vol de points réussi
- Secret mode : cacher pendant le round, révéler après

#### Modifications Backend nécessaires
```typescript
// Socket events à ajouter
socket.on('target_assigned', (data: {
  targetId: string,
  targetName: string,
  targetColor: string
}) => {
  // Recevoir sa cible secrète
})

socket.emit('tueurs_buzz', {
  roomCode: string
})

socket.on('tueurs_result', (data: {
  correct: boolean,
  pointsGained: number,
  pointsStolen: number,
  targetName: string
}) => {
  // Résultat avec vol de points
})
```

### Modifications Frontend

#### `src/app/player/[roomCode]/page.tsx`
```tsx
{gameMode === 'tueurs_gages' && (
  <div className="space-y-6">
    <TargetIndicator
      targetName={myTarget?.name || '?'}
      targetColor={myTarget?.color || '#ccc'}
      targetScore={myTarget?.score || 0}
      showTarget={!roundActive} // Cacher pendant le round
    />

    <Buzzer
      onClick={handleTueursBuzz}
      disabled={!roundActive || hasBuzzed}
      size="xl"
      buzzerSound={myBuzzerSound}
    />

    {hasBuzzed && (
      <div className="text-center">
        <p className="text-2xl mb-2">🎯 Buzzé !</p>
        <p className="text-sm text-text-secondary">
          Si vous répondez correctement, vous volerez des points à {myTarget?.name}
        </p>
      </div>
    )}
  </div>
)}
```

#### `src/app/host/control/[roomCode]/page.tsx`
Afficher la carte des cibles :
```tsx
<div className="grid grid-cols-2 gap-4">
  {players.map(player => {
    const target = targets[player.id]
    return (
      <div key={player.id} className="bg-bg-card p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: player.color }}
          />
          <span className="font-semibold">{player.name}</span>
        </div>
        <div className="text-sm text-text-secondary mt-2">
          🎯 Cible : {target?.name || 'Aucune'}
        </div>
      </div>
    )
  })}
</div>
```

#### `src/app/display/[roomCode]/page.tsx`
Animation de vol de points :
```tsx
{result && result.mode === 'tueurs_gages' && (
  <div className="text-center">
    {result.correct ? (
      <>
        <div className="text-9xl mb-4">🎯</div>
        <h2 className="text-5xl font-bold text-success mb-4">
          Cible Éliminée !
        </h2>
        <p className="text-3xl mb-2">
          {result.winner} → +{result.pointsGained} points
        </p>
        <p className="text-2xl text-error">
          {result.target} → -{result.pointsStolen} points
        </p>
      </>
    ) : (
      <>
        <div className="text-9xl mb-4">❌</div>
        <h2 className="text-5xl font-bold text-error mb-4">
          Raté !
        </h2>
        <p className="text-2xl">
          La cible est sauve... pour cette fois.
        </p>
      </>
    )}
  </div>
)}
```

---

## 🎨 Cohérence Visuelle

### Palette de Couleurs par Mode
```typescript
// Ajouter dans src/lib/constants.ts
export const MODE_THEMES = {
  accumul_points: {
    primary: '#4A90E2',
    gradient: 'from-blue-500 to-blue-700'
  },
  reflexoquiz: {
    primary: '#F5A623',
    gradient: 'from-orange-500 to-orange-700'
  },
  qcm: {
    primary: '#7B68EE',
    gradient: 'from-purple-500 to-purple-700'
  },
  questions_rafale: {
    primary: '#50E3C2',
    gradient: 'from-teal-500 to-teal-700'
  },
  chaud_devant: {
    primary: '#E94B3C',
    gradient: 'from-red-500 to-red-700'
  },
  tueurs_gages: {
    primary: '#9013FE',
    gradient: 'from-purple-600 to-indigo-700'
  }
}
```

---

## 📱 Tests Recommandés

### Pour chaque mode
1. **Test Solo** : 1 joueur, vérifier le flux complet
2. **Test Multi** : 3-5 joueurs, tester les interactions
3. **Test Edge Cases** :
   - Déconnexion pendant le round
   - Plusieurs buzzers simultanés
   - Réponses simultanées (QCM, Rafale)
   - Aucun buzzer (timeout)

### Checklist d'intégration
- [ ] Socket events backend implémentés
- [ ] Composants UI créés
- [ ] Pages player/host/display modifiées
- [ ] Sons/animations ajoutés
- [ ] Tests manuels effectués
- [ ] Documentation mise à jour

---

## 🚀 Ordre d'Implémentation Recommandé

1. **Mode 4 : Questions en Rafale** (le plus simple - juste des indices)
2. **Mode 6 : Tueurs à Gages** (réutilise le système de buzz d'Accumul' Points)
3. **Mode 5 : Chaud Devant** (le plus complexe - logique de timing inversée)

---

## 📦 Fichiers à Modifier

### Tous les modes
- `src/types/game.ts` : Ajouter nouveaux types
- `src/types/socket-events.ts` : Ajouter nouveaux events
- `src/app/player/[roomCode]/page.tsx` : Logique player
- `src/app/host/control/[roomCode]/page.tsx` : Logique host
- `src/app/display/[roomCode]/page.tsx` : Affichage TV

### Mode-specific
- Mode 4 : `src/components/game/HintReveal.tsx`
- Mode 5 : `src/components/game/BombTimer.tsx`
- Mode 6 : `src/components/game/TargetIndicator.tsx`

---

## 💡 Conseils d'Implémentation

### Gestion de l'État
Utiliser un état conditionnel basé sur le mode :
```tsx
const [gameMode, setGameMode] = useState<GameMode>('accumul_points')

// Dans le render
{gameMode === 'questions_rafale' && <HintReveal ... />}
{gameMode === 'chaud_devant' && <BombTimer ... />}
{gameMode === 'tueurs_gages' && <TargetIndicator ... />}
```

### Réutilisation de Composants
- Le composant `Buzzer` peut être réutilisé pour tous les modes
- Le composant `Leaderboard` est universel
- Créer des variantes spécifiques seulement si nécessaire

### Animations
Utiliser Tailwind animations + custom CSS :
```css
@keyframes bomb-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes hint-reveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🎯 Résultat Final Attendu

À la fin de l'implémentation des 6 modes :
- ✅ 6 modes de jeu entièrement fonctionnels
- ✅ Interface utilisateur cohérente et intuitive
- ✅ Animations et sons pour chaque mode
- ✅ Gestion des erreurs et edge cases
- ✅ Documentation complète
- ✅ Tests unitaires et d'intégration

**Bon courage pour l'implémentation ! 🚀**
