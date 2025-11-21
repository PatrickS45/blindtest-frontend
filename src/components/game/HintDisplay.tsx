'use client'

import { cn } from '@/lib/utils'

interface HintDisplayProps {
  hints: string[]
  currentHintIndex: number
  playerName: string
}

export function HintDisplay({ hints, currentHintIndex, playerName }: HintDisplayProps) {
  // Show only hints up to current index
  const visibleHints = hints.slice(0, currentHintIndex + 1)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-bg-card rounded-3xl p-6 border-2 border-primary/30">
        <h2 className="text-2xl font-display font-bold text-center text-primary flex items-center justify-center gap-3">
          <span className="text-4xl">💡</span>
          <span>Questions en Rafale</span>
        </h2>
        <p className="text-center text-text-secondary mt-2">
          Des indices apparaissent progressivement
        </p>
      </div>

      {/* Hints Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hints.map((hint, index) => {
          const isVisible = index <= currentHintIndex
          const isLatest = index === currentHintIndex

          return (
            <div
              key={index}
              className={cn(
                'relative rounded-2xl p-6 border-2 transition-all duration-500',
                isVisible ? (
                  isLatest ? 'bg-success/20 border-success animate-fade-in scale-105' :
                  'bg-bg-card border-primary/30'
                ) : 'bg-bg-dark border-border opacity-40'
              )}
            >
              {/* Hint Number */}
              <div className={cn(
                'absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                isVisible ? 'bg-primary text-white' : 'bg-border text-text-secondary'
              )}>
                {index + 1}
              </div>

              {/* Lock Icon for Hidden Hints */}
              {!isVisible && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-2">🔒</div>
                  <p className="text-text-secondary text-sm">Indice verrouillé</p>
                </div>
              )}

              {/* Hint Content */}
              {isVisible && (
                <div className="pt-6">
                  <p className={cn(
                    'text-lg font-semibold text-center',
                    isLatest && 'text-success'
                  )}>
                    {hint}
                  </p>
                  {isLatest && (
                    <div className="mt-3 text-center">
                      <span className="inline-block bg-success/20 text-success px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        ✨ NOUVEAU
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="bg-bg-card rounded-2xl p-6 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">Progression</span>
          <span className="text-sm font-bold text-primary">
            {currentHintIndex + 1} / {hints.length} indices
          </span>
        </div>
        <div className="w-full bg-bg-dark rounded-full h-4 overflow-hidden border-2 border-border">
          <div
            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
            style={{ width: `${((currentHintIndex + 1) / hints.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-6">
        <p className="text-center text-sm text-text-secondary">
          💡 Plus vous répondez vite, plus vous gagnez de points ! Buzzez dès que vous savez.
        </p>
      </div>

      {/* Player Name */}
      <div className="text-center">
        <div className="font-display text-2xl text-text-secondary">{playerName}</div>
      </div>
    </div>
  )
}
