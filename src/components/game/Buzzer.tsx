'use client'

import { useSoundEffect } from '@/hooks/useAudio'
import { useVibration } from '@/hooks/useVibration'
import { cn } from '@/lib/utils'

interface BuzzerProps {
  onClick: () => void
  disabled: boolean
  buzzerSound?: number
  size?: 'medium' | 'large' | 'xl'
  className?: string
}

export function Buzzer({
  onClick,
  disabled,
  buzzerSound,
  size = 'xl',
  className,
}: BuzzerProps) {
  const { playBuzzer } = useSoundEffect()
  const { vibrate, short } = useVibration()

  const handleBuzz = () => {
    if (disabled) return

    // Play buzzer sound
    if (buzzerSound) {
      playBuzzer(buzzerSound)
    }

    // Vibrate
    vibrate(200)

    // Call parent handler
    onClick()
  }

  const sizeClasses = {
    medium: 'w-48 h-48 text-4xl',
    large: 'w-64 h-64 text-5xl',
    xl: 'w-80 h-80 text-6xl',
  }

  return (
    <button
      onClick={handleBuzz}
      disabled={disabled}
      className={cn(
        'rounded-full font-display font-bold',
        'transition-all duration-200',
        'shadow-2xl',
        disabled
          ? 'bg-gray-600 opacity-50 cursor-not-allowed'
          : 'bg-gradient-to-br from-primary to-primary-dark shadow-glow-xl cursor-pointer hover:scale-105 active:scale-90 active:shadow-glow animate-ripple',
        sizeClasses[size],
        className
      )}
      aria-label={disabled ? 'Buzzer désactivé' : 'Appuyez pour buzzer'}
      aria-pressed={!disabled}
    >
      {disabled ? '⚡ Buzzé' : '🔴 BUZZ'}
    </button>
  )
}
