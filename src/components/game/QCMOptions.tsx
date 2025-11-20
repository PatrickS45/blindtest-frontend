'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface QCMOption {
  id: string
  text: string
  label: 'A' | 'B' | 'C' | 'D'
}

interface QCMOptionsProps {
  options: QCMOption[]
  onAnswer: (optionId: string) => void
  disabled?: boolean
  selectedOption?: string | null
  correctOption?: string | null
  showResults?: boolean
}

const OPTION_COLORS = {
  A: '#4A90E2', // Blue
  B: '#F5A623', // Orange
  C: '#7B68EE', // Purple
  D: '#50E3C2', // Teal
}

export function QCMOptions({
  options,
  onAnswer,
  disabled = false,
  selectedOption = null,
  correctOption = null,
  showResults = false,
}: QCMOptionsProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const handleOptionClick = (optionId: string) => {
    if (disabled || selectedOption) return
    onAnswer(optionId)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((option) => {
        const isSelected = selectedOption === option.id
        const isCorrect = showResults && correctOption === option.id
        const isWrong = showResults && isSelected && correctOption !== option.id
        const isHovered = hoveredOption === option.id

        return (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            onMouseEnter={() => setHoveredOption(option.id)}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled || !!selectedOption}
            className={cn(
              'relative p-6 rounded-3xl border-4 transition-all duration-300',
              'text-left font-semibold text-lg',
              'disabled:cursor-not-allowed',
              // Default state
              !isSelected && !showResults && 'bg-bg-card border-primary/20 hover:border-primary hover:scale-105',
              // Hover effect
              isHovered && !isSelected && !showResults && 'shadow-xl',
              // Selected state
              isSelected && !showResults && 'border-primary bg-primary/20 scale-105',
              // Results: Correct answer
              isCorrect && 'border-success bg-success/20 animate-pulse',
              // Results: Wrong answer
              isWrong && 'border-error bg-error/20'
            )}
            style={{
              borderColor: isSelected && !showResults
                ? OPTION_COLORS[option.label]
                : undefined,
            }}
          >
            {/* Option Label Badge */}
            <div
              className={cn(
                'absolute -top-3 -left-3 w-12 h-12 rounded-xl',
                'flex items-center justify-center',
                'font-display text-2xl font-bold',
                'border-4 border-white shadow-lg',
                'transition-transform duration-300',
                isSelected && 'scale-125',
                isCorrect && 'animate-bounce'
              )}
              style={{
                backgroundColor: OPTION_COLORS[option.label],
                color: 'white',
              }}
            >
              {option.label}
            </div>

            {/* Option Text */}
            <div className="mt-2 text-text-primary">
              {option.text}
            </div>

            {/* Result Indicator */}
            {showResults && (
              <div className="absolute top-4 right-4 text-4xl">
                {isCorrect && '✓'}
                {isWrong && '✗'}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Helper component for displaying QCM stats on host/display
interface QCMStatsProps {
  options: QCMOption[]
  answers: Record<string, number> // optionId -> count
  totalAnswers: number
  correctOption?: string | null
}

export function QCMStats({ options, answers, totalAnswers, correctOption }: QCMStatsProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const count = answers[option.id] || 0
        const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0
        const isCorrect = correctOption === option.id

        return (
          <div key={option.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: OPTION_COLORS[option.label] }}
                >
                  {option.label}
                </div>
                <span className={cn('font-semibold', isCorrect && 'text-success')}>
                  {option.text}
                  {isCorrect && ' ✓'}
                </span>
              </div>
              <span className="font-mono text-sm text-text-secondary">
                {count}/{totalAnswers} ({percentage.toFixed(0)}%)
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  isCorrect ? 'bg-success' : 'bg-primary/50'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
