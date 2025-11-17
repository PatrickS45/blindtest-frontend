/**
 * Application Constants
 */

import { ModeConfig } from '@/types/game'

// ==========================================
// GAME MODES
// ==========================================

export const GAME_MODES: ModeConfig[] = [
  {
    id: 'accumul_points',
    name: "Accumul' Points",
    emoji: '🎯',
    description: 'Mode classique avec validation manuelle',
    color: '#4A90E2',
    features: [
      'Buzzer pour répondre',
      'Validation par le MC',
      '+10 points si correct',
      '-5 points si faux',
    ],
  },
  {
    id: 'reflexoquiz',
    name: 'Réflex-O-Quiz',
    emoji: '⚡',
    description: 'Bonus de vitesse selon l\'ordre',
    color: '#F5A623',
    features: [
      'Ordre des buzzers compte',
      '1er: +15 points',
      '2e: +10 points',
      '3e: +5 points',
    ],
  },
  {
    id: 'qcm',
    name: 'QCM Musical',
    emoji: '🎓',
    description: 'Questions à choix multiples',
    color: '#7B68EE',
    features: [
      '4 réponses proposées',
      'Auto-généré par IA',
      'Validation automatique',
      'Points selon vitesse',
    ],
  },
  {
    id: 'questions_rafale',
    name: 'Questions en Rafale',
    emoji: '🎬',
    description: 'Indices progressifs',
    color: '#50E3C2',
    features: [
      'Indices toutes les 5s',
      'Bonus si réponse rapide',
      'Buzzer libre',
      'Max 3 indices',
    ],
  },
  {
    id: 'chaud_devant',
    name: 'Chaud Devant',
    emoji: '💣',
    description: 'Patate chaude musicale',
    color: '#E94B3C',
    features: [
      'Bombe de 30 secondes',
      'Passer à un autre joueur',
      '-15 points à l\'explosion',
      'Stress maximum',
    ],
  },
  {
    id: 'tueurs_gages',
    name: 'Tueurs à Gages',
    emoji: '🎯',
    description: 'Volez les points des adversaires',
    color: '#9013FE',
    features: [
      'Cibler un adversaire',
      'Voler 10 points',
      'Stratégie avancée',
      'Alliances possibles',
    ],
  },
]

// ==========================================
// PLAYER COLORS
// ==========================================

export const PLAYER_COLORS = [
  '#FF3366', // Pink
  '#00D9FF', // Cyan
  '#FFD700', // Gold
  '#00FF88', // Green
  '#FF6B9D', // Light Pink
  '#50E3C2', // Turquoise
  '#F5A623', // Orange
  '#7B68EE', // Medium Purple
  '#E94B3C', // Red
  '#9013FE', // Purple
  '#4A90E2', // Blue
  '#27AE60', // Dark Green
  '#E74C3C', // Dark Red
  '#F39C12', // Dark Orange
  '#3498DB', // Light Blue
  '#9B59B6', // Dark Purple
  '#1ABC9C', // Teal
  '#E67E22', // Carrot Orange
  '#95A5A6', // Gray
  '#34495E', // Dark Gray
  '#16A085', // Dark Teal
  '#2980B9', // Strong Blue
  '#8E44AD', // Strong Purple
]

// ==========================================
// SOCKET CONFIG
// ==========================================

export const SOCKET_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  RECONNECTION_DELAY: 1000,
  RECONNECTION_ATTEMPTS: 5,
  TIMEOUT: 10000,
} as const

// ==========================================
// GAME CONFIG
// ==========================================

export const GAME_CONFIG = {
  MAX_PLAYERS: 23,
  DEFAULT_ROUNDS: 10,
  ROOM_CODE_LENGTH: 4,
  ANSWER_TIMEOUT_MS: 8000,
  WARNING_TIMEOUT_MS: 4000,
  CHAUD_BOMB_TIMER_MS: 30000,
  RAFALE_HINT_DELAY_MS: 5000,
  AUDIO_PREVIEW_DURATION: 30, // seconds
} as const

// ==========================================
// ROUTES
// ==========================================

export const ROUTES = {
  HOME: '/',
  HOST_SELECT: '/host',
  HOST_CONTROL: (roomCode: string) => `/host/control/${roomCode}`,
  DISPLAY: (roomCode: string) => `/display/${roomCode}`,
  PLAYER: (roomCode: string) => `/player/${roomCode}`,
  PLAYER_JOIN: '/player',
} as const

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================

export const STORAGE_KEYS = {
  GAME_STATE: 'blindtest_game_state',
  PLAYER_NAME: 'blindtest_player_name',
  VOLUME: 'blindtest_volume',
  RECENT_ROOMS: 'blindtest_recent_rooms',
} as const
