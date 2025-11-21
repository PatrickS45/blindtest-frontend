'use client'

import { Player } from '@/types/game'
import { cn } from '@/lib/utils'

interface BuzzOrderProps {
  buzzOrder: Array<{ playerId: string; playerName: string; timestamp: number }>
  players: Player[]
  compact?: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

export function BuzzOrder({ buzzOrder, players, compact = false }: BuzzOrderProps) {
  if (buzzOrder.length === 0) {
    return (
      <div className="text-center text-text-secondary py-8">
        ⏳ En attente des buzzers...
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {buzzOrder.map((buzz, index) => {
        const player = players.find((p) => p.id === buzz.playerId)
        const medal = MEDALS[index] || `${index + 1}.`
        const isTopThree = index < 3

        return (
          <div
            key={buzz.playerId}
            className={cn(
              'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
              isTopThree
                ? 'bg-gradient-to-r from-primary/10 to-transparent border-primary/30'
                : 'bg-bg-card border-primary/10',
              compact && 'p-3'
            )}
          >
            {/* Medal / Position */}
            <div
              className={cn(
                'flex items-center justify-center rounded-xl font-display font-bold',
                isTopThree ? 'w-12 h-12 text-3xl' : 'w-10 h-10 text-xl bg-bg-dark'
              )}
            >
              {medal}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className={cn('font-semibold', compact ? 'text-base' : 'text-lg')}>
                {buzz.playerName}
              </div>
              {!compact && player && (
                <div className="text-sm text-text-secondary">Score actuel : {player.score}</div>
              )}
            </div>

            {/* Timestamp */}
            {!compact && (
              <div className="text-sm text-text-secondary font-mono">
                {(buzz.timestamp / 1000).toFixed(2)}s
              </div>
            )}

            {/* Player Color Indicator */}
            {player && (
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: player.color }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
