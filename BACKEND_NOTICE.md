# 📋 NOTICE POUR LE BACKEND - Système de Scoring Personnalisé

## 🎯 Objectif

Implémenter un système de scoring personnalisé permettant d'attribuer des points différents selon que le joueur trouve :
- **Artiste + Titre corrects** → Points complets (configurable, défaut : 10 pts)
- **1 bonne réponse sur 2** (artiste OU titre) → Points partiels (configurable, défaut : 5 pts)
- **Les 2 faux** → Pénalité (configurable, défaut : -5 pts)

---

## 📦 Modifications Frontend Déjà Effectuées

### 1. Types TypeScript Mis à Jour

#### Interface `ScoringConfig` (types/game.ts)
```typescript
export interface ScoringConfig {
  pointsFullCorrect: number      // Points si artiste ET titre corrects
  pointsPartialCorrect: number   // Points si 1 sur 2 correct
  pointsBothWrong: number         // Pénalité si les 2 sont faux
}

export const DEFAULT_SCORING: ScoringConfig = {
  pointsFullCorrect: 10,
  pointsPartialCorrect: 5,
  pointsBothWrong: -5,
}
```

#### Interface `DetailedAnswer` (types/game.ts)
```typescript
export interface DetailedAnswer {
  artistCorrect: boolean
  titleCorrect: boolean
}
```

#### Interface `GameSession` mise à jour
```typescript
export interface GameSession {
  // ... champs existants
  scoringConfig?: ScoringConfig // NOUVEAU: Configuration de scoring personnalisée
  createdAt: Date
}
```

### 2. Événements Socket Modifiés (types/socket-events.ts)

#### Événement `create_game` (Client → Serveur)
```typescript
create_game: (data?: {
  mode: GameMode
  playMode?: PlayMode
  config?: {
    numberOfRounds?: number
    randomStart?: boolean
    numberOfTeams?: number
  }
  scoringConfig?: ScoringConfig  // NOUVEAU
}) => void
```

#### Événement `game_created` (Serveur → Client)
```typescript
game_created: (data: {
  roomCode: string
  hostId: string
  mode: GameMode
  playMode: PlayMode
  scoringConfig?: ScoringConfig  // NOUVEAU
}) => void
```

#### Événement `game_state` (Serveur → Client)
```typescript
game_state: (data: {
  // ... champs existants
  scoringConfig?: ScoringConfig  // NOUVEAU
}) => void
```

#### Événement `validate_answer` (Client → Serveur) - **RÉTRO-COMPATIBLE**
```typescript
validate_answer: (data: {
  roomCode: string
  playerId: string
  isCorrect?: boolean           // Ancienne méthode (pour compatibilité)
  detailedAnswer?: DetailedAnswer // NOUVELLE méthode avec détails
}) => void
```

### 3. UI Frontend

- **Page de création de partie** : Sliders pour configurer les 3 paramètres de scoring
- **Page de contrôle hôte** : 4 boutons pour valider les réponses :
  - ✓✓ Artiste + Titre
  - ✗✗ Les 2 faux
  - ✓ Artiste seulement
  - ✓ Titre seulement

---

## 🛠️ Modifications à Effectuer sur le Backend

### 1. Modèle de Données (GameSession)

Ajouter le champ `scoringConfig` dans le modèle de session de jeu :

```typescript
interface GameSession {
  roomCode: string
  mode: GameMode
  playMode: PlayMode
  hostId: string
  players: Player[]
  teams?: Team[]
  state: GameState
  currentRound: number
  totalRounds: number
  playlistId?: string
  playlistName?: string
  scoringConfig?: ScoringConfig  // AJOUTER CE CHAMP
  createdAt: Date
}
```

### 2. Gestionnaire d'Événement `create_game`

Mettre à jour le gestionnaire pour :
1. Accepter `scoringConfig` dans les paramètres
2. Stocker `scoringConfig` dans la session
3. Utiliser `DEFAULT_SCORING` si non fourni

**Exemple de code :**
```typescript
socket.on('create_game', (data) => {
  const {
    mode,
    playMode = 'solo',
    config = {},
    scoringConfig = DEFAULT_SCORING  // Utiliser les valeurs par défaut si non fourni
  } = data || {}

  const roomCode = generateRoomCode()

  const gameSession: GameSession = {
    roomCode,
    mode,
    playMode,
    hostId: socket.id,
    players: [],
    teams: playMode === 'team' ? [] : undefined,
    state: 'setup',
    currentRound: 0,
    totalRounds: config.numberOfRounds || 10,
    scoringConfig,  // Stocker la configuration
    createdAt: new Date()
  }

  // Stocker la session
  gameSessions.set(roomCode, gameSession)

  // Répondre au client
  socket.emit('game_created', {
    roomCode,
    hostId: socket.id,
    mode,
    playMode,
    scoringConfig  // Renvoyer la configuration
  })
})
```

### 3. Gestionnaire d'Événement `validate_answer`

**IMPORTANT : Garder la rétro-compatibilité avec l'ancien système !**

Mettre à jour pour gérer DEUX modes de validation :
- **Mode ancien** : `isCorrect: boolean` (pour compatibilité)
- **Mode nouveau** : `detailedAnswer: { artistCorrect, titleCorrect }`

**Logique de calcul des points :**
```typescript
socket.on('validate_answer', (data) => {
  const { roomCode, playerId, isCorrect, detailedAnswer } = data
  const gameSession = gameSessions.get(roomCode)

  if (!gameSession) return

  // Récupérer la config de scoring (ou utiliser les valeurs par défaut)
  const scoring = gameSession.scoringConfig || DEFAULT_SCORING

  let pointsAwarded = 0

  // MODE NOUVEAU : Validation détaillée (prioritaire)
  if (detailedAnswer) {
    const { artistCorrect, titleCorrect } = detailedAnswer

    if (artistCorrect && titleCorrect) {
      // Les 2 corrects → Points complets
      pointsAwarded = scoring.pointsFullCorrect
    } else if (artistCorrect || titleCorrect) {
      // 1 sur 2 correct → Points partiels
      pointsAwarded = scoring.pointsPartialCorrect
    } else {
      // Les 2 faux → Pénalité
      pointsAwarded = scoring.pointsBothWrong
    }
  }
  // MODE ANCIEN : Validation simple (rétro-compatibilité)
  else if (isCorrect !== undefined) {
    pointsAwarded = isCorrect ? scoring.pointsFullCorrect : scoring.pointsBothWrong
  }

  // Mettre à jour le score du joueur
  const player = gameSession.players.find(p => p.id === playerId)
  if (player) {
    player.score += pointsAwarded
  }

  // Si mode équipe, mettre à jour le score de l'équipe
  if (gameSession.playMode === 'team' && player?.teamId) {
    const team = gameSession.teams?.find(t => t.id === player.teamId)
    if (team) {
      team.score = gameSession.players
        .filter(p => p.teamId === team.id)
        .reduce((sum, p) => sum + p.score, 0)
    }
  }

  // Émettre les résultats...
  // (logique existante pour émettre round_result, leaderboards, etc.)
})
```

### 4. Événements à Émettre avec `scoringConfig`

S'assurer que les événements suivants incluent `scoringConfig` :

#### `game_state`
```typescript
socket.emit('game_state', {
  state: gameSession.state,
  mode: gameSession.mode,
  playMode: gameSession.playMode,
  players: gameSession.players,
  teams: gameSession.teams,
  currentRound: gameSession.currentRound,
  totalRounds: gameSession.totalRounds,
  playlistId: gameSession.playlistId,
  playlistName: gameSession.playlistName,
  scoringConfig: gameSession.scoringConfig  // AJOUTER
})
```

---

## 📊 Exemples de Scénarios

### Scénario 1 : Configuration par défaut
```typescript
// Frontend envoie
socket.emit('create_game', {
  mode: 'accumul_points',
  playMode: 'solo'
  // scoringConfig non fourni
})

// Backend utilise DEFAULT_SCORING
scoringConfig = {
  pointsFullCorrect: 10,
  pointsPartialCorrect: 5,
  pointsBothWrong: -5
}
```

### Scénario 2 : Configuration personnalisée
```typescript
// Frontend envoie
socket.emit('create_game', {
  mode: 'accumul_points',
  playMode: 'solo',
  scoringConfig: {
    pointsFullCorrect: 15,    // Plus généreux
    pointsPartialCorrect: 7,  // Points partiels augmentés
    pointsBothWrong: -3       // Pénalité réduite
  }
})

// Backend stocke et utilise cette config personnalisée
```

### Scénario 3 : Validation détaillée
```typescript
// Joueur trouve l'artiste mais pas le titre
socket.emit('validate_answer', {
  roomCode: 'ABC123',
  playerId: 'player-1',
  detailedAnswer: {
    artistCorrect: true,
    titleCorrect: false
  }
})

// Backend calcule : pointsAwarded = scoringConfig.pointsPartialCorrect (5 pts par défaut)
```

---

## ✅ Checklist de Validation

- [ ] Le champ `scoringConfig` est ajouté au modèle `GameSession`
- [ ] L'événement `create_game` accepte et stocke `scoringConfig`
- [ ] L'événement `game_created` renvoie `scoringConfig`
- [ ] L'événement `game_state` inclut `scoringConfig`
- [ ] L'événement `validate_answer` gère les deux modes (ancien + nouveau)
- [ ] Le calcul des points utilise la configuration personnalisée
- [ ] Les valeurs par défaut sont appliquées si `scoringConfig` n'est pas fourni
- [ ] Le système fonctionne en mode solo ET en mode équipe
- [ ] Les tests couvrent les 3 cas : artiste+titre, 1/2, 0/2

---

## 🔗 Liens Utiles

- **Repository Frontend** : https://github.com/PatrickS45/blindtest-frontend
- **Repository Backend** : https://github.com/PatrickS45/blindtest-backend
- **Fichiers modifiés côté frontend** :
  - `src/types/game.ts`
  - `src/types/socket-events.ts`
  - `src/app/host/page.tsx`
  - `src/app/host/control/[roomCode]/page.tsx`

---

## 📝 Notes Importantes

1. **Rétro-compatibilité** : L'ancien système avec `isCorrect: boolean` doit continuer à fonctionner
2. **Valeurs par défaut** : Toujours utiliser `DEFAULT_SCORING` si `scoringConfig` n'est pas fourni
3. **Mode équipe** : Ne pas oublier de recalculer le score d'équipe après chaque validation
4. **Validation** : S'assurer que les points sont bien ajoutés/retirés du score total du joueur

---

**Date de création** : 2025-12-07
**Créé par** : Claude (Frontend)
**À destination de** : Claude Web (Backend)
