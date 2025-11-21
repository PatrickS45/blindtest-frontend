'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface BombTimerProps {
  hasBomb: boolean
  timeLeft: number
  totalTime: number
  playerName: string
}

export function BombTimer({ hasBomb, timeLeft, totalTime, playerName }: BombTimerProps) {
  const [shake, setShake] = useState(false)
  const percentage = (timeLeft / totalTime) * 100

  // Shake animation when time is running out
  useEffect(() => {
    if (hasBomb && timeLeft <= 3 && timeLeft > 0) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [hasBomb, timeLeft])

  const getDangerLevel = () => {
    if (!hasBomb) return 'safe'
    if (timeLeft <= 3) return 'critical'
    if (timeLeft <= 10) return 'danger'
    return 'warning'
  }

  const dangerLevel = getDangerLevel()

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Bomb Display */}
      <div
        className={cn(
          'relative rounded-3xl p-8 border-4 transition-all duration-300',
          shake && 'animate-shake',
          hasBomb ? (
            dangerLevel === 'critical' ? 'bg-error/30 border-error animate-pulse' :
            dangerLevel === 'danger' ? 'bg-warning/30 border-warning' :
            'bg-warning/20 border-warning/50'
          ) : 'bg-success/10 border-success/30'
        )}
      >
        {/* Bomb Icon */}
        <div className={cn(
          'text-9xl text-center mb-6 transition-transform duration-300',
          shake && 'scale-110'
        )}>
          {hasBomb ? '💣' : '✅'}
        </div>

        {/* Status Text */}
        <h2 className={cn(
          'text-4xl font-display font-bold text-center mb-4',
          hasBomb ? 'text-error' : 'text-success'
        )}>
          {hasBomb ? 'Vous avez la bombe !' : 'Vous êtes en sécurité'}
        </h2>

        {hasBomb && (
          <>
            {/* Time Left Display */}
            <div className="text-center mb-6">
              <div className={cn(
                'text-7xl font-display font-bold',
                dangerLevel === 'critical' ? 'text-error animate-pulse' :
                dangerLevel === 'danger' ? 'text-warning' :
                'text-text-primary'
              )}>
                {timeLeft.toFixed(1)}s
              </div>
              <p className="text-text-secondary mt-2">
                {dangerLevel === 'critical' ? '🚨 ATTENTION !' :
                 dangerLevel === 'danger' ? '⚠️ Danger imminent...' :
                 'Temps restant'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-bg-dark rounded-full h-6 overflow-hidden border-2 border-border">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  dangerLevel === 'critical' ? 'bg-error animate-pulse' :
                  dangerLevel === 'danger' ? 'bg-warning' :
                  'bg-primary'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </>
        )}

        {!hasBomb && (
          <p className="text-center text-text-secondary text-xl">
            La bombe est chez un autre joueur...
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className={cn(
        'rounded-2xl p-6 border-2',
        hasBomb ? 'bg-warning/10 border-warning/20' : 'bg-bg-card border-border'
      )}>
        <p className="text-center text-sm text-text-secondary">
          {hasBomb ? (
            <>💣 <strong className="text-warning">La bombe peut changer de joueur à tout moment !</strong> Buzzez si vous connaissez la réponse pour vous en débarrasser.</>
          ) : (
            <>✅ Vous êtes en sécurité pour le moment. Restez prêt, la bombe peut vous arriver !</>
          )}
        </p>
      </div>

      {/* Player Name */}
      <div className="text-center">
        <div className="font-display text-2xl text-text-secondary">{playerName}</div>
      </div>
    </div>
  )
}
