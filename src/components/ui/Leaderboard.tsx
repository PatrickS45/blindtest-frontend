'use client'

import { Player } from '@/types/game'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  players: Player[]
  compact?: boolean
  className?: string
}

export function Leaderboard({ players, compact = false, className }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  if (players.length === 0) {
    return (
      <div className={cn('text-center p-8 text-text-secondary', className)}>
        <div className="text-4xl mb-2">👥</div>
        <p>Aucun joueur connecté</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sortedPlayers.map((player, index) => {
        const isTop3 = index < 3
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null

        return (
          <div
            key={player.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-2xl transition-all',
              'border-2',
              isTop3
                ? 'bg-gradient-to-r from-bg-card to-bg-medium border-primary/30'
                : 'bg-bg-card border-transparent',
              compact ? 'p-3' : 'p-4',
              !player.isConnected && 'opacity-50'
            )}
          >
            {/* Position & Medal */}
            <div className="flex items-center gap-4 flex-1">
              <div className={cn('font-display font-bold', compact ? 'text-2xl' : 'text-3xl')}>
                {medal || `${index + 1}.`}
              </div>

              {/* Player Color Indicator */}
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: player.color }}
              />

              {/* Player Name */}
              <div className={cn('font-display font-semibold', compact ? 'text-base' : 'text-xl')}>
                {player.name}
              </div>

              {/* Connection Status */}
              {!player.isConnected && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <span className="text-lg">⚠️</span>
                  <span>Déconnecté</span>
                </div>
              )}
            </div>

            {/* Score */}
            <div
              className={cn(
                'font-display font-bold text-primary',
                compact ? 'text-xl' : 'text-2xl'
              )}
            >
              {player.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}
