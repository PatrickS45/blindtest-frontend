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
} from './game'

// ==========================================
// CLIENT TO SERVER EVENTS
// ==========================================

export interface ClientToServerEvents {
  // Game Management
  create_game: (data?: { mode: GameMode }) => void
  join_game: (data: { roomCode: string; playerName: string }) => void
  leave_game: (data: { roomCode: string }) => void

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

  // Host Validation
  validate_answer: (data: {
    roomCode: string
    isCorrect: boolean
  }) => void
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
  }) => void

  game_state: (data: {
    state: GameState
    mode: GameMode
    players: Player[]
    currentRound: number
    totalRounds: number
    playlistId?: string
    playlistName?: string
  }) => void

  // Player Management
  player_joined: (data: {
    player: Player
    players: Player[]
  }) => void

  player_left: (data: {
    playerId: string
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
    winner: Player
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
    totalRounds: number
    winner?: Player
  }) => void
}

// ==========================================
// TYPED SOCKET
// ==========================================

import { Socket } from 'socket.io-client'

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>
