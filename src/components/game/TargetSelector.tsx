'use client'

import { cn } from '@/lib/utils'

interface TargetSelectorProps {
  players: Array<{
    id: string
    name: string
  }>
  currentPlayerId: string
  onSelectTarget: (targetId: string) => void
  selectedTargetId: string | null
  disabled?: boolean
}

export function TargetSelector({
  players,
  currentPlayerId,
  onSelectTarget,
  selectedTargetId,
  disabled = false
}: TargetSelectorProps) {
  // Filter out current player from available targets
  const availableTargets = players.filter(p => p.id !== currentPlayerId)

  if (availableTargets.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-bg-card rounded-3xl p-8 border-2 border-warning/30">
          <p className="text-center text-text-secondary">
            Pas assez de joueurs pour choisir une cible
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-bg-card rounded-3xl p-6 border-2 border-error/30">
        <h2 className="text-2xl font-display font-bold text-center text-error flex items-center justify-center gap-3">
          <span className="text-4xl">🎯</span>
          <span>Choisissez votre cible</span>
        </h2>
        <p className="text-center text-text-secondary mt-2 text-sm">
          Si vous répondez correctement, vous volerez des points à votre cible !
        </p>
      </div>

      {/* Target Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableTargets.map((player) => {
          const isSelected = selectedTargetId === player.id

          return (
            <button
              key={player.id}
              onClick={() => !disabled && onSelectTarget(player.id)}
              disabled={disabled}
              className={cn(
                'relative p-6 rounded-2xl border-2 transition-all duration-300',
                'hover:scale-105 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                isSelected
                  ? 'bg-error/20 border-error shadow-lg shadow-error/20'
                  : 'bg-bg-card border-border hover:border-error/50'
              )}
            >
              {/* Crosshair Animation for Selected Target */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-20 h-20 animate-pulse">
                    {/* Horizontal line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-error" />
                    {/* Vertical line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-error" />
                    {/* Circle */}
                    <div className="absolute inset-2 rounded-full border-2 border-error animate-ping" />
                    <div className="absolute inset-4 rounded-full border-2 border-error" />
                  </div>
                </div>
              )}

              {/* Player Info */}
              <div className="relative z-10">
                <div className="text-4xl mb-2">
                  {isSelected ? '🎯' : '👤'}
                </div>
                <div className={cn(
                  'font-display font-bold text-lg',
                  isSelected ? 'text-error' : 'text-text-primary'
                )}>
                  {player.name}
                </div>
                {isSelected && (
                  <div className="mt-2 text-sm text-error font-semibold">
                    ✓ Cible sélectionnée
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Info Box */}
      {selectedTargetId && !disabled && (
        <div className="bg-success/10 border-2 border-success/20 rounded-xl p-4">
          <p className="text-sm text-text-secondary text-center">
            ✓ Cible confirmée ! Buzzez maintenant pour répondre.
          </p>
        </div>
      )}
    </div>
  )
}
