/**
 * Socket.IO Events - Type-safe event definitions
 * These types ensure consistency between client and server
 */

import {
  GameMode,
  GameState,
  Player,
  RoundData,
  BuzzData,
  RoundResult,
  Track,
  Team,
  PlayMode,
  ScoringConfig,
  DetailedAnswer,
} from './game'

// ==========================================
// CLIENT TO SERVER EVENTS
// ==========================================

export interface ClientToServerEvents {
  // Game Management
  create_game: (data?: {
    mode: GameMode
    playMode?: PlayMode
    config?: {
      numberOfRounds?: number
      randomStart?: boolean
      numberOfTeams?: number
    }
    scoringConfig?: ScoringConfig
  }) => void
  join_game: (data: { roomCode: string; playerName: string }) => void
  leave_game: (data: { roomCode: string }) => void

  // Team Management
  create_team: (data: {
    roomCode: string
    teamName: string
    teamColor: string
  }) => void
  join_team: (data: {
    roomCode: string
    teamId: string
  }) => void
  leave_team: (data: {
    roomCode: string
    playerId?: string
  }) => void
  update_team: (data: {
    roomCode: string
    teamId: string
    teamName?: string
    teamColor?: string
  }) => void
  delete_team: (data: {
    roomCode: string
    teamId: string
  }) => void
  assign_player_to_team: (data: {
    roomCode: string
    playerId: string
    teamId: string
  }) => void

  // Host Actions
  join_as_host: (data: { roomCode: string }) => void
  load_playlist: (data: { roomCode: string; playlistId: string }) => void
  start_round: (data: { roomCode: string }) => void
  skip_round: (data: { roomCode: string }) => void
  end_game: (data: { roomCode: string }) => void

  // Player Actions
  buzz: (data: { roomCode: string }) => void
  submit_qcm_answer: (data: {
    roomCode: string
    optionIndex: number
    timestamp: number
  }) => void
  pass_bomb: (data: {
    roomCode: string
    targetPlayerId: string
  }) => void
  select_target: (data: {
    roomCode: string
    targetPlayerId: string
  }) => void

  // Trivia Actions
  load_trivia_questions: (
    data: {
      roomCode: string
      provider?: string
      category?: string
      difficulty?: string
    },
    callback?: (response: { success: boolean; questions?: any; error?: string }) => void
  ) => void
  get_trivia_categories: (
    data: { provider?: string },
    callback?: (response: { success: boolean; categories?: string[]; error?: string }) => void
  ) => void
  get_trivia_providers: (
    data: {},
    callback?: (response: { success: boolean; providers?: any[]; error?: string }) => void
  ) => void
  validate_qcm: (data: { roomCode: string }) => void

  // Host Validation
  validate_answer: (data: {
    roomCode: string
    playerId: string
    isCorrect?: boolean // Ancienne méthode (rétro-compatible)
    detailedAnswer?: DetailedAnswer // Nouvelle méthode avec détails
  }) => void
  continue_round: (data: { roomCode: string }) => void
  end_round: (data: { roomCode: string }) => void
  resume_audio: (data: { roomCode: string }) => void
}

// ==========================================
// SERVER TO CLIENT EVENTS
// ==========================================

export interface ServerToClientEvents {
  // Game State Updates
  game_created: (data: {
    roomCode: string
    hostId: string
    mode: GameMode
    playMode: PlayMode
    scoringConfig?: ScoringConfig
  }) => void

  game_state: (data: {
    state: GameState
    mode: GameMode
    playMode: PlayMode
    players: Player[]
    teams?: Team[]
    currentRound: number
    totalRounds: number
    playlistId?: string
    playlistName?: string
    scoringConfig?: ScoringConfig
  }) => void

  // Team Management
  team_created: (data: {
    team: Team
    teams: Team[]
  }) => void

  team_updated: (data: {
    team: Team
    teams: Team[]
  }) => void

  team_deleted: (data: {
    teamId: string
    teams: Team[]
  }) => void

  player_joined_team: (data: {
    playerId: string
    teamId: string
    team: Team
    teams: Team[]
  }) => void

  player_left_team: (data: {
    playerId: string
    teamId: string
    teams: Team[]
  }) => void

  teams_updated: (data: {
    teams: Team[]
  }) => void

  // Player Management
  player_joined: (data: {
    player: Player
    players: Player[]
  }) => void

  player_left: (data: {
    playerId: string
    playerName: string
    players: Player[]
  }) => void

  player_disconnected: (data: {
    playerId: string
    playerName: string
    players: Player[]
  }) => void

  // Playlist Management
  playlist_loaded: (data: {
    playlistId: string
    playlistName: string
    trackCount: number
  }) => void

  playlist_error: (data: {
    message: string
  }) => void

  // Round Management
  round_started: (data: {
    round: RoundData
    state: GameState
  }) => void

  round_skipped: (data: {
    answer: string
    leaderboard: Player[]
  }) => void

  // Buzz Events
  buzz_locked: (data: BuzzData) => void

  buzz_confirmed: (data: {
    position?: number
  }) => void

  buzz_rejected: (data: {
    message: string
  }) => void

  // Answer Validation
  correct_answer: (data: {
    playerId: string
    playerName: string
    points: number
  }) => void

  wrong_answer: (data: {
    playerId: string
    playerName: string
    pointsLost: number
  }) => void

  wrong_answer_continue: (data: {
    message: string
  }) => void

  partial_answer_validated: (data: {
    playerId: string
    playerName: string
    points: number
    artistFound: boolean
    titleFound: boolean
    waitingForHost: boolean // True si on attend que l'hôte décide de continuer ou terminer
  }) => void

  round_continuing: (data: {
    message: string
    artistFound: boolean
    titleFound: boolean
  }) => void

  // Timeouts
  timeout_warning: (data: {
    secondsLeft: number
  }) => void

  timeout_continue: (data: {
    message: string
  }) => void

  timeout_expired: () => void

  // Round Results
  round_result: (data: RoundResult) => void

  // Audio Control
  play_track: (data: {
    previewUrl: string
    duration: number
    startTime?: number
  }) => void

  stop_music: () => void

  resume_audio: () => void

  // Game End
  game_ended: (data: {
    finalLeaderboard: Player[]
    teamLeaderboard?: Team[]
    winner: Player
    winnerTeam?: Team
  }) => void

  // Errors
  error: (data: {
    message: string
    code?: string
  }) => void

  // Mode-specific Events
  qcm_results: (data: {
    correctIndex: number
    results: Array<{
      playerId: string
      selectedIndex: number
      isCorrect: boolean
      points: number
      responseTime: number
    }>
  }) => void

  reflexo_ranking: (data: {
    ranking: Array<{
      playerId: string
      order: number
      points: number
    }>
  }) => void

  bomb_passed: (data: {
    fromPlayerId: string
    toPlayerId: string
    timeLeft: number
  }) => void

  bomb_exploded: (data: {
    victimId: string
    victimName: string
    pointsLost: number
  }) => void

  target_selected: (data: {
    attackerId: string
    targetId: string
  }) => void

  points_stolen: (data: {
    attackerId: string
    targetId: string
    pointsStolen: number
  }) => void

  hint_revealed: (data: {
    hintIndex: number
    hint: string
    bonusPointsLeft: number
  }) => void

  bomb_holder_changed: (data: {
    bombHolder: string
    timeLeft: number
  }) => void

  game_finished: (data: {
    leaderboard: Player[]
    teamLeaderboard?: Team[]
    totalRounds: number
    winner?: Player
    winnerTeam?: Team
  }) => void

  // Trivia Events
  trivia_loaded: (data: {
    questionCount: number
    category?: string
    difficulty?: string
    provider?: string
  }) => void

  qcm_result: (data: {
    results: Array<{
      playerId: string
      playerName: string
      answer: string
      isCorrect: boolean
      pointsAwarded: number
      newScore: number
      responseTime?: number
    }>
    correctAnswer: string
    correctOption: string
    leaderboard: Player[]
    teamLeaderboard?: Team[]
  }) => void

  countdown_tick: (data: {
    timeRemaining: number
  }) => void

  countdown_end: () => void
}

// ==========================================
// TYPED SOCKET
// ==========================================

import { Socket } from 'socket.io-client'

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>
