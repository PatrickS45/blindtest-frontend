'use client'

import { ModeConfig } from '@/types/game'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ModeCardProps extends ModeConfig {
  selected: boolean
  onClick: () => void
}

export function ModeCard({
  id,
  name,
  emoji,
  description,
  color,
  features,
  selected,
  onClick,
}: ModeCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative p-6 rounded-3xl transition-all duration-300 text-left',
        'border-4 w-full',
        'transform hover:scale-105 active:scale-100',
        'focus:outline-none focus:ring-4 focus:ring-primary/30',
        selected
          ? 'border-primary scale-105 shadow-glow-lg'
          : 'border-transparent hover:border-primary/50 shadow-md',
        'bg-bg-card'
      )}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${color}15, ${color}30)`
          : undefined,
      }}
    >
      {/* Emoji Icon */}
      <div
        className={cn(
          'text-6xl mb-4 transition-transform duration-300',
          isHovered && 'scale-110 rotate-6'
        )}
      >
        {emoji}
      </div>

      {/* Mode Name */}
      <h3 className="font-display text-2xl font-semibold mb-2 text-text-primary">
        {name}
      </h3>

      {/* Description */}
      <p className="text-text-secondary mb-4 text-sm">{description}</p>

      {/* Features List */}
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start text-sm text-text-primary"
          >
            <span className="mr-2 text-primary font-bold">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Selected Badge */}
      {selected && (
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold text-white animate-fade-in"
          style={{ backgroundColor: color }}
        >
          Sélectionné
        </div>
      )}

      {/* Color Accent Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl transition-all duration-300"
        style={{
          backgroundColor: color,
          opacity: selected ? 1 : isHovered ? 0.6 : 0.3,
        }}
      />
    </button>
  )
}
