# 📋 MÉMO BACKEND - Corrections à apporter

**Date :** 2025-12-05
**Contexte :** Retour de tests utilisateur - Problèmes avec équipes, mode de jeu et déconnexion

---

## 🔴 PROBLÈMES RAPPORTÉS

1. **Déconnexion : perte de points**
2. **Mode de jeu ne marche pas**
3. **Les équipes ne marchent pas**

---

## ✅ CE QUI A ÉTÉ CORRIGÉ CÔTÉ FRONTEND

### 1. Bug de timing pour la sélection d'équipe
- **Problème :** Les joueurs sautaient l'écran de sélection d'équipe
- **Cause :** Le frontend marquait le joueur comme "rejoint" avant de recevoir le `game_state`
- **Solution :** Attendre la confirmation du serveur (`player_joined`) avant d'afficher l'UI

### 2. Logs de débugging ajoutés
- Tous les événements d'équipes sont maintenant loggés avec `[TEAM DEBUG]`
- Les événements de mode de jeu avec `[MODE DEBUG]`
- Les événements de connexion avec `[JOIN DEBUG]`

---

## 🔧 CE QUI DOIT ÊTRE CORRIGÉ CÔTÉ BACKEND

## 1. 🔴 CRITIQUE : Déconnexion - Perte de points

### Problème
Quand un joueur se déconnecte et se reconnecte, son score est perdu (remis à 0).

### Cause probable
Le backend ne restaure pas le score d'un joueur existant quand il rejoint à nouveau.

### Solution requise

```javascript
// Dans le handler de 'join_game'
socket.on('join_game', ({ roomCode, playerName }) => {
  const game = games.get(roomCode)

  // ✅ VÉRIFIER SI LE JOUEUR EXISTE DÉJÀ
  const existingPlayer = game.players.find(p => p.name === playerName)

  if (existingPlayer) {
    // RECONNEXION - Restaurer le joueur existant
    console.log(`[RECONNECT] Player ${playerName} reconnecting with score ${existingPlayer.score}`)
    existingPlayer.isConnected = true
    existingPlayer.socketId = socket.id  // Mettre à jour le socket ID

    // Émettre player_joined avec le score existant
    socket.emit('player_joined', {
      player: existingPlayer,
      players: game.players
    })
  } else {
    // NOUVEAU JOUEUR - Créer avec score à 0
    const newPlayer = {
      id: generateId(),
      name: playerName,
      score: 0,
      socketId: socket.id,
      isConnected: true,
      color: assignColor(),
      buzzerSound: Math.floor(Math.random() * 23) + 1
    }
    game.players.push(newPlayer)

    socket.emit('player_joined', {
      player: newPlayer,
      players: game.players
    })
  }

  // ✅ IMPORTANT : Envoyer game_state pour le playMode et les teams
  socket.emit('game_state', {
    state: game.state,
    mode: game.mode,
    playMode: game.playMode,
    players: game.players,
    teams: game.teams,
    currentRound: game.currentRound,
    totalRounds: game.totalRounds
  })
})
```

### Points clés
- ✅ Identifier les joueurs par leur **nom** (pas par socket ID)
- ✅ Restaurer le **score existant** lors de la reconnexion
- ✅ Mettre à jour le **socketId** pour les nouveaux événements
- ✅ Marquer `isConnected = true`

---

## 2. ⚠️ IMPORTANT : Mode de jeu ne marche pas

### Problème
Le mode de jeu sélectionné par l'hôte ne semble pas s'appliquer.

### Vérifications à faire

#### A. Le mode est-il bien enregistré ?
```javascript
socket.on('create_game', ({ mode, playMode, config }) => {
  console.log('[CREATE GAME] Mode:', mode, 'PlayMode:', playMode)

  const game = {
    roomCode: generateRoomCode(),
    mode: mode,  // ✅ Vérifier que c'est bien enregistré
    playMode: playMode || 'solo',
    // ...
  }

  games.set(roomCode, game)
})
```

#### B. Le mode est-il envoyé dans `game_state` ?
```javascript
socket.emit('game_state', {
  state: game.state,
  mode: game.mode,           // ✅ DOIT être envoyé
  playMode: game.playMode,   // ✅ DOIT être envoyé
  players: game.players,
  teams: game.teams,
  // ...
})
```

#### C. Le mode est-il envoyé dans `round_started` ?
```javascript
socket.on('start_round', ({ roomCode }) => {
  const game = games.get(roomCode)

  io.to(roomCode).emit('round_started', {
    round: {
      roundNumber: game.currentRound,
      track: currentTrack,
      // ...
    },
    state: 'playing',
    mode: game.mode  // ✅ AJOUTER CECI (actuellement manquant selon les types frontend)
  })
})
```

### Types attendus par le frontend

Le frontend s'attend à recevoir le mode dans **deux endroits** :

1. **Dans `game_state`** (au join et quand ça change)
2. **Dans `round_started`** (au début de chaque manche)

Actuellement, selon les types TypeScript frontend, `round_started` ne contient PAS le mode :
```typescript
// Type actuel (manque le mode)
round_started: (data: {
  round: RoundData
  state: GameState
}) => void

// Type attendu
round_started: (data: {
  round: RoundData
  state: GameState
  mode: GameMode  // ← À ajouter
}) => void
```

---

## 3. ⚠️ IMPORTANT : Les équipes ne marchent pas

### Problème
Les équipes ne semblent pas fonctionner correctement.

### Vérifications requises

#### A. Événements émis lors de la création d'équipe

```javascript
socket.on('create_team', ({ roomCode, teamName, teamColor }) => {
  console.log('[CREATE TEAM]', { roomCode, teamName, teamColor })

  const game = games.get(roomCode)
  const team = {
    id: generateId(),
    name: teamName,
    color: teamColor,
    score: 0,
    memberIds: [],
    createdAt: new Date()
  }

  game.teams.push(team)

  // ✅ ÉMETTRE L'ÉVÉNEMENT (important !)
  io.to(roomCode).emit('team_created', {
    team: team,
    teams: game.teams
  })

  console.log('[CREATE TEAM] Success, teams:', game.teams)
})
```

#### B. Événements émis lors de l'assignation d'un joueur

```javascript
socket.on('assign_player_to_team', ({ roomCode, playerId, teamId }) => {
  console.log('[ASSIGN PLAYER]', { roomCode, playerId, teamId })

  const game = games.get(roomCode)
  const player = game.players.find(p => p.id === playerId)
  const team = game.teams.find(t => t.id === teamId)

  if (!player || !team) {
    console.error('[ASSIGN PLAYER] Player or team not found')
    return
  }

  // Retirer des autres équipes
  game.teams.forEach(t => {
    t.memberIds = t.memberIds.filter(id => id !== playerId)
  })

  // Ajouter à la nouvelle équipe
  team.memberIds.push(playerId)
  player.teamId = teamId

  // Recalculer le score de l'équipe
  team.score = team.memberIds.reduce((sum, memberId) => {
    const member = game.players.find(p => p.id === memberId)
    return sum + (member?.score || 0)
  }, 0)

  // ✅ ÉMETTRE LES ÉVÉNEMENTS (important !)
  io.to(roomCode).emit('player_joined_team', {
    playerId: playerId,
    teamId: teamId,
    team: team,
    teams: game.teams
  })

  io.to(roomCode).emit('teams_updated', {
    teams: game.teams
  })

  console.log('[ASSIGN PLAYER] Success, updated teams:', game.teams)
})
```

#### C. Événements émis lors du join d'un joueur à une équipe

```javascript
socket.on('join_team', ({ roomCode, teamId }) => {
  console.log('[JOIN TEAM]', { roomCode, teamId, playerId: socket.playerId })

  const game = games.get(roomCode)
  const player = game.players.find(p => p.socketId === socket.id)
  const team = game.teams.find(t => t.id === teamId)

  if (!player || !team) {
    console.error('[JOIN TEAM] Player or team not found')
    return
  }

  // Retirer des autres équipes
  game.teams.forEach(t => {
    t.memberIds = t.memberIds.filter(id => id !== player.id)
  })

  // Ajouter à la nouvelle équipe
  team.memberIds.push(player.id)
  player.teamId = teamId

  // Recalculer le score de l'équipe
  team.score = team.memberIds.reduce((sum, memberId) => {
    const member = game.players.find(p => p.id === memberId)
    return sum + (member?.score || 0)
  }, 0)

  // ✅ ÉMETTRE LES ÉVÉNEMENTS
  io.to(roomCode).emit('player_joined_team', {
    playerId: player.id,
    teamId: teamId,
    team: team,
    teams: game.teams
  })

  io.to(roomCode).emit('teams_updated', {
    teams: game.teams
  })

  console.log('[JOIN TEAM] Success, player', player.name, 'joined team', team.name)
})
```

#### D. Mise à jour du score d'équipe après chaque manche

```javascript
function updateTeamScores(game) {
  if (game.playMode !== 'team' || !game.teams) return

  game.teams.forEach(team => {
    team.score = team.memberIds.reduce((sum, memberId) => {
      const member = game.players.find(p => p.id === memberId)
      return sum + (member?.score || 0)
    }, 0)
  })
}

// À appeler après chaque attribution de points
socket.on('validate_answer', ({ roomCode, playerId, isCorrect }) => {
  const game = games.get(roomCode)
  const player = game.players.find(p => p.id === playerId)

  if (isCorrect) {
    player.score += getPointsForMode(game.mode)
  } else {
    player.score += getPenaltyForMode(game.mode)
  }

  // ✅ Mettre à jour les scores d'équipe
  updateTeamScores(game)

  io.to(roomCode).emit('round_result', {
    // ...
    leaderboard: game.players.sort((a, b) => b.score - a.score),
    teamLeaderboard: game.teams.sort((a, b) => b.score - a.score)  // ✅ Envoyer le classement des équipes
  })
})
```

---

## 📋 CHECKLIST DE VÉRIFICATION

### Déconnexion / Reconnexion
- [ ] Le joueur est identifié par son **nom** (pas socket ID)
- [ ] Le **score est restauré** lors de la reconnexion
- [ ] Le **socketId est mis à jour** lors de la reconnexion
- [ ] `isConnected` est bien géré (true/false)
- [ ] Le `player_joined` contient le score actuel
- [ ] Le `game_state` est envoyé après le join

### Mode de jeu
- [ ] Le mode est bien **enregistré** dans l'objet game
- [ ] Le mode est **envoyé dans `game_state`**
- [ ] Le mode est **envoyé dans `round_started`**
- [ ] Les composants spécifiques au mode fonctionnent (QCM, Reflexo, etc.)
- [ ] Les points sont attribués selon le mode

### Équipes
- [ ] `create_team` émet bien `team_created`
- [ ] `update_team` émet bien `team_updated`
- [ ] `delete_team` émet bien `team_deleted`
- [ ] `assign_player_to_team` émet `player_joined_team` et `teams_updated`
- [ ] `join_team` émet `player_joined_team` et `teams_updated`
- [ ] `leave_team` émet `player_left_team` et `teams_updated`
- [ ] Les scores d'équipe sont **recalculés** après chaque manche
- [ ] Le `teamLeaderboard` est envoyé dans `round_result`
- [ ] Le `game_state` contient bien les équipes quand `playMode === 'team'`

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Reconnexion
1. Joueur rejoint une partie
2. Joueur gagne des points (score = 30)
3. Joueur ferme l'onglet
4. Joueur rejoint à nouveau avec **le même pseudo**
5. **Vérification :** Le score doit être 30 (pas 0)

### Test 2 : Mode de jeu
1. Hôte crée une partie avec mode "Reflexo-Quiz"
2. Hôte lance une manche
3. Joueur buzz en 1er
4. **Vérification :** Le joueur doit gagner 15 points (pas 10)
5. **Console backend :** Logs doivent montrer le mode "reflexoquiz"

### Test 3 : Équipes
1. Hôte crée une partie en mode équipe
2. Hôte crée 2 équipes (Rouge et Bleue)
3. Joueur 1 rejoint
4. **Vérification :** Joueur 1 voit l'écran de sélection d'équipe
5. Joueur 1 choisit équipe Rouge
6. **Vérification :** L'équipe Rouge contient le joueur 1
7. Joueur 1 gagne 10 points
8. **Vérification :** L'équipe Rouge a 10 points (score = somme des membres)

---

## 📊 ÉVÉNEMENTS SOCKET - RÉFÉRENCE RAPIDE

### Événements reçus (Client → Serveur)
| Événement | Données | Action |
|-----------|---------|--------|
| `join_game` | `{ roomCode, playerName }` | Ajouter/restaurer joueur + envoyer `game_state` |
| `create_team` | `{ roomCode, teamName, teamColor }` | Créer équipe + émettre `team_created` |
| `update_team` | `{ roomCode, teamId, teamName, teamColor }` | Modifier équipe + émettre `team_updated` |
| `delete_team` | `{ roomCode, teamId }` | Supprimer équipe + émettre `team_deleted` |
| `assign_player_to_team` | `{ roomCode, playerId, teamId }` | Assigner joueur + émettre `player_joined_team` |
| `join_team` | `{ roomCode, teamId }` | Joueur rejoint équipe + émettre `player_joined_team` |
| `leave_team` | `{ roomCode, playerId }` | Retirer joueur + émettre `player_left_team` |

### Événements émis (Serveur → Client)
| Événement | Données | Quand ? |
|-----------|---------|---------|
| `game_state` | `{ mode, playMode, teams, players, ... }` | Après join, changement de mode, création équipe |
| `player_joined` | `{ player, players }` | Quand un joueur rejoint |
| `team_created` | `{ team, teams }` | Après création d'équipe |
| `team_updated` | `{ team, teams }` | Après modification d'équipe |
| `team_deleted` | `{ teamId, teams }` | Après suppression d'équipe |
| `player_joined_team` | `{ playerId, teamId, team, teams }` | Quand joueur rejoint équipe |
| `player_left_team` | `{ playerId, teamId, teams }` | Quand joueur quitte équipe |
| `teams_updated` | `{ teams }` | À chaque changement d'équipes |
| `round_started` | `{ round, state, mode }` | Au début de chaque manche |
| `round_result` | `{ leaderboard, teamLeaderboard, ... }` | À la fin de chaque manche |

---

## 🔍 LOGS À AJOUTER POUR DÉBUGGER

```javascript
// Au join
console.log('[JOIN] Player', playerName, 'joining room', roomCode)
console.log('[JOIN] Existing player?', !!existingPlayer)
if (existingPlayer) {
  console.log('[JOIN] Restoring score:', existingPlayer.score)
}

// Mode de jeu
console.log('[CREATE GAME] Mode:', mode, 'PlayMode:', playMode)
console.log('[ROUND START] Current mode:', game.mode)

// Équipes
console.log('[CREATE TEAM] Team created:', team.name)
console.log('[ASSIGN PLAYER] Player', player.name, 'assigned to team', team.name)
console.log('[TEAMS] Current teams:', game.teams.map(t => ({ name: t.name, members: t.memberIds.length })))
```

---

## 📞 CONTACT

Si tu as des questions sur les corrections frontend ou besoin de plus de détails :
- Vérifie les logs avec `[TEAM DEBUG]`, `[MODE DEBUG]`, `[JOIN DEBUG]`
- Teste avec la console du navigateur ouverte (F12)
- Les types TypeScript sont dans `/src/types/socket-events.ts`

**Bon courage ! 🚀**
