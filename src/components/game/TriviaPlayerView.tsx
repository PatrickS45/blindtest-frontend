'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TriviaOption } from '@/types/game'

interface TriviaPlayerViewProps {
  question: string
  options: TriviaOption[]
  timeRemaining: number
  initialTime: number
  onAnswer: (optionIndex: number) => void
  selectedOption: number | null
  showResults?: boolean
  myResult?: {
    isCorrect: boolean
    pointsAwarded: number
    newScore: number
  } | null
  disabled?: boolean
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const
const OPTION_COLORS = {
  A: '#4A90E2', // Blue
  B: '#F5A623', // Orange
  C: '#7B68EE', // Purple
  D: '#50E3C2', // Teal
}

export function TriviaPlayerView({
  question,
  options,
  timeRemaining,
  initialTime,
  onAnswer,
  selectedOption,
  showResults = false,
  myResult = null,
  disabled = false,
}: TriviaPlayerViewProps) {
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    setIsUrgent(timeRemaining <= 5 && timeRemaining > 0)
  }, [timeRemaining])

  // Vibration feedback
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const handleAnswer = (index: number) => {
    if (disabled || selectedOption !== null) return

    vibrate(50) // Short vibration on tap
    onAnswer(index)
  }

  const percentage = Math.max(0, (timeRemaining / initialTime) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex flex-col p-4">
      {/* Timer */}
      <div className="mb-6 space-y-3">
        <div
          className={cn(
            'w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl font-display font-bold border-8 transition-all duration-300',
            isUrgent
              ? 'border-error text-error animate-pulse'
              : timeRemaining <= 0
              ? 'border-warning text-warning'
              : 'border-primary text-primary'
          )}
        >
          {timeRemaining > 0 ? Math.ceil(timeRemaining) : '⏰'}
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-bg-dark rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-100',
              isUrgent ? 'bg-error' : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-bg-card rounded-3xl p-6 mb-6 border-2 border-primary/30">
        <p className="text-xl font-semibold text-center leading-tight">
          {question}
        </p>
      </div>

      {/* Answer Buttons */}
      <div className="flex-1 space-y-4">
        {options.map((option, index) => {
          const label = OPTION_LABELS[index]
          const isSelected = selectedOption === index
          const isCorrect = showResults && option.correct

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={disabled || selectedOption !== null}
              className={cn(
                'w-full p-5 rounded-2xl border-4 transition-all duration-300',
                'flex items-center gap-4',
                'disabled:cursor-not-allowed',
                'active:scale-95',
                'touch-action-manipulation select-none',
                // Default state
                !isSelected && !showResults && 'bg-bg-card border-primary/30 active:border-primary',
                // Selected state
                isSelected && !showResults && 'bg-primary/20 border-primary scale-105',
                // Results: Correct answer
                showResults && isCorrect && 'bg-success/20 border-success',
                // Results: Wrong answer (selected but not correct)
                showResults && isSelected && !isCorrect && 'bg-error/20 border-error',
                // Results: Not selected
                showResults && !isSelected && !isCorrect && 'bg-bg-card border-border opacity-50'
              )}
              style={{
                borderColor: isSelected && !showResults
                  ? OPTION_COLORS[label]
                  : undefined,
              }}
            >
              {/* Option Label */}
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  'font-display text-2xl font-bold',
                  'border-4 border-white shadow-lg flex-shrink-0',
                  'transition-transform duration-300',
                  isSelected && 'scale-110'
                )}
                style={{
                  backgroundColor: OPTION_COLORS[label],
                  color: 'white',
                }}
              >
                {label}
              </div>

              {/* Option Text */}
              <div className="flex-1 text-left font-semibold text-lg">
                {option.text}
              </div>

              {/* Result Indicator */}
              {showResults && (
                <div className="text-4xl flex-shrink-0">
                  {isCorrect && '✓'}
                  {isSelected && !isCorrect && '✗'}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback Message */}
      {selectedOption !== null && !showResults && (
        <div className="mt-6 bg-primary/20 border-2 border-primary rounded-2xl p-4 text-center animate-fade-in">
          <p className="font-semibold text-lg">✓ Réponse enregistrée</p>
          <p className="text-sm text-text-secondary mt-1">
            En attente des résultats...
          </p>
        </div>
      )}

      {/* Results */}
      {showResults && myResult && (
        <div
          className={cn(
            'mt-6 rounded-3xl p-6 text-center animate-fade-in border-4',
            myResult.isCorrect
              ? 'bg-success/20 border-success'
              : 'bg-error/20 border-error'
          )}
        >
          <div className="text-6xl mb-3">
            {myResult.isCorrect ? '🎉' : '😔'}
          </div>
          <p className={cn(
            'font-display text-3xl font-bold mb-2',
            myResult.isCorrect ? 'text-success' : 'text-error'
          )}>
            {myResult.isCorrect ? 'Bravo !' : 'Dommage !'}
          </p>
          <p className={cn(
            'text-4xl font-display font-bold mb-2',
            myResult.pointsAwarded > 0 ? 'text-success' : 'text-error'
          )}>
            {myResult.pointsAwarded > 0 ? '+' : ''}
            {myResult.pointsAwarded} points
          </p>
          <p className="text-xl text-text-secondary font-mono">
            Score total : {myResult.newScore}
          </p>
        </div>
      )}
    </div>
  )
}

// Waiting state for trivia mode
export function TriviaWaiting({ roundNumber }: { roundNumber: number }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="text-8xl animate-bounce">🤔</div>
        <h2 className="font-display text-3xl font-bold">
          En attente...
        </h2>
        <p className="text-xl text-text-secondary">
          Préparez-vous pour la question {roundNumber} !
        </p>
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
