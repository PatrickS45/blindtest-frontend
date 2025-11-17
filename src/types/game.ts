/**
 * Game Types - Shared TypeScript interfaces for the Blind Test game
 */

// ==========================================
// GAME MODES
// ==========================================

export type GameMode =
  | 'accumul_points'
  | 'reflexoquiz'
  | 'qcm'
  | 'questions_rafale'
  | 'chaud_devant'
  | 'tueurs_gages'

export interface ModeConfig {
  id: GameMode
  name: string
  emoji: string
  description: string
  color: string
  features: string[]
}

// ==========================================
// PLAYER
// ==========================================

export interface Player {
  id: string
  name: string
  score: number
  color: string
  buzzerSound?: number // 1-23
  isConnected: boolean
}

// ==========================================
// GAME STATE
// ==========================================

export type GameState =
  | 'setup'       // Host configuring playlist
  | 'lobby'       // Waiting for players
  | 'playing'     // Round in progress
  | 'validation'  // Waiting for host validation
  | 'result'      // Showing round result
  | 'ended'       // Game finished

export interface GameSession {
  roomCode: string
  mode: GameMode
  hostId: string
  players: Player[]
  state: GameState
  currentRound: number
  totalRounds: number
  playlistId?: string
  playlistName?: string
  createdAt: Date
}

// ==========================================
// ROUND DATA
// ==========================================

export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  previewUrl: string
  duration: number // seconds
}

export interface RoundData {
  roundNumber: number
  track: Track
  startedAt: Date
  qcm?: QCMQuestion
  hints?: string[]
  bombHolder?: string // Player ID for "Chaud Devant"
  targetPlayer?: string // Player ID for "Tueurs à Gages"
}

export interface QCMQuestion {
  question: string
  options: QCMOption[]
  correctIndex: number
}

export interface QCMOption {
  text: string
  isCorrect: boolean
}

// ==========================================
// BUZZ DATA
// ==========================================

export interface BuzzData {
  playerId: string
  playerName: string
  playerColor: string
  buzzerSound: number
  timestamp: Date
  order?: number // For reflexoquiz mode (1st, 2nd, 3rd)
}

// ==========================================
// ROUND RESULT
// ==========================================

export interface RoundResult {
  roundNumber: number
  track: Track
  winnerId?: string
  winnerName?: string
  pointsAwarded: Record<string, number> // playerId -> points
  correctAnswer: string
  leaderboard: Player[]
}

// ==========================================
// CONSTANTS
// ==========================================

export const POINTS = {
  ACCUMUL_CORRECT: 10,
  ACCUMUL_WRONG: -5,
  REFLEXO_FIRST: 15,
  REFLEXO_SECOND: 10,
  REFLEXO_THIRD: 5,
  QCM_CORRECT: 10,
  RAFALE_BASE: 10,
  RAFALE_BONUS_MAX: 5,
  CHAUD_PENALTY: -15,
  TUEURS_STEAL: 10,
} as const

export const TIMERS = {
  ANSWER_TIMEOUT: 8000,    // 8 seconds to answer
  WARNING_TIMEOUT: 4000,   // Warning at 4 seconds
  CHAUD_BOMB: 30000,       // 30 seconds bomb timer
  RAFALE_HINT_DELAY: 5000, // 5 seconds between hints
} as const

export const MAX_PLAYERS = 23 // Limited by buzzer sounds
