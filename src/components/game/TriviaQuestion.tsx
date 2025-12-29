'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TriviaOption } from '@/types/game'

interface TriviaQuestionProps {
  question: string
  options: TriviaOption[]
  category?: string
  difficulty?: string
  roundNumber: number
  totalRounds: number
  timeRemaining: number
  initialTime: number
  showResults?: boolean
  correctAnswer?: string
  playerAnswers?: Record<string, number> // optionIndex -> count
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const
const OPTION_COLORS = {
  A: '#4A90E2', // Blue
  B: '#F5A623', // Orange
  C: '#7B68EE', // Purple
  D: '#50E3C2', // Teal
}

export function TriviaQuestion({
  question,
  options,
  category,
  difficulty,
  roundNumber,
  totalRounds,
  timeRemaining,
  initialTime,
  showResults = false,
  correctAnswer,
  playerAnswers = {},
}: TriviaQuestionProps) {
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    setIsUrgent(timeRemaining <= 5 && timeRemaining > 0)
  }, [timeRemaining])

  const percentage = Math.max(0, (timeRemaining / initialTime) * 100)
  const totalAnswers = Object.values(playerAnswers).reduce((a, b) => a + b, 0)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {category && (
            <div className="bg-primary/20 border-2 border-primary px-4 py-2 rounded-xl">
              <span className="font-semibold text-primary">{category}</span>
            </div>
          )}
          {difficulty && (
            <div className="bg-bg-card px-4 py-2 rounded-xl border-2 border-border">
              <span className="text-text-secondary capitalize">{difficulty}</span>
            </div>
          )}
        </div>
        <div className="font-display text-2xl font-bold text-text-secondary">
          Question {roundNumber}/{totalRounds}
        </div>
      </div>

      {/* Timer */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-4">
          <div
            className={cn(
              'w-32 h-32 rounded-full flex items-center justify-center text-6xl font-display font-bold border-8 transition-all duration-300',
              isUrgent
                ? 'border-error text-error animate-pulse scale-110'
                : timeRemaining <= 0
                ? 'border-warning text-warning'
                : 'border-primary text-primary'
            )}
          >
            {timeRemaining > 0 ? Math.ceil(timeRemaining) : '⏰'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-bg-dark rounded-full overflow-hidden">
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
      <div className="bg-bg-card rounded-3xl p-8 border-4 border-primary/30">
        <h1 className="text-4xl font-display font-bold text-center leading-tight">
          {question}
        </h1>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option, index) => {
          const label = OPTION_LABELS[index]
          const isCorrect = showResults && option.correct
          const answerCount = playerAnswers[index] || 0
          const answerPercentage = totalAnswers > 0 ? (answerCount / totalAnswers) * 100 : 0

          return (
            <div
              key={index}
              className={cn(
                'relative p-6 rounded-3xl border-4 transition-all duration-500',
                'text-left font-semibold text-xl',
                !showResults && 'bg-bg-card border-primary/20',
                showResults && isCorrect && 'bg-success/20 border-success animate-pulse',
                showResults && !isCorrect && 'bg-bg-card border-border opacity-70'
              )}
            >
              {/* Option Label Badge */}
              <div
                className={cn(
                  'absolute -top-3 -left-3 w-14 h-14 rounded-xl',
                  'flex items-center justify-center',
                  'font-display text-3xl font-bold',
                  'border-4 border-white shadow-lg',
                  'transition-transform duration-300',
                  isCorrect && 'scale-125 animate-bounce'
                )}
                style={{
                  backgroundColor: OPTION_COLORS[label],
                  color: 'white',
                }}
              >
                {label}
              </div>

              {/* Option Text */}
              <div className="mt-3 text-text-primary pl-8">
                {option.text}
              </div>

              {/* Result Indicator */}
              {showResults && (
                <>
                  <div className="absolute top-6 right-6 text-5xl">
                    {isCorrect && '✓'}
                  </div>

                  {/* Answer Stats */}
                  {totalAnswers > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">
                          {answerCount} joueur{answerCount !== 1 ? 's' : ''}
                        </span>
                        <span className="font-mono text-text-secondary">
                          {answerPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-500',
                            isCorrect ? 'bg-success' : 'bg-primary/50'
                          )}
                          style={{ width: `${answerPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Correct Answer Display */}
      {showResults && correctAnswer && (
        <div className="bg-success/20 border-4 border-success rounded-3xl p-6 text-center animate-fade-in">
          <div className="text-2xl font-semibold text-success mb-2">
            ✓ Bonne réponse
          </div>
          <div className="text-3xl font-display font-bold">
            {correctAnswer}
          </div>
        </div>
      )}
    </div>
  )
}

// Component for displaying individual player results
interface TriviaResultsProps {
  results: Array<{
    playerId: string
    playerName: string
    answer: string
    isCorrect: boolean
    pointsAwarded: number
    newScore: number
  }>
}

export function TriviaResults({ results }: TriviaResultsProps) {
  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {results.map((result, index) => (
        <div
          key={result.playerId}
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300',
            result.isCorrect
              ? 'bg-success/20 border-success'
              : 'bg-error/20 border-error'
          )}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'text-3xl',
                result.isCorrect ? 'animate-bounce' : 'animate-shake'
              )}
            >
              {result.isCorrect ? '✅' : '❌'}
            </div>
            <div>
              <div className="font-semibold text-lg">{result.playerName}</div>
              <div className="text-sm text-text-secondary">
                {result.answer}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'font-display text-2xl font-bold',
                result.pointsAwarded > 0 ? 'text-success' : 'text-error'
              )}
            >
              {result.pointsAwarded > 0 ? '+' : ''}
              {result.pointsAwarded}
            </div>
            <div className="text-sm text-text-secondary font-mono">
              {result.newScore} pts
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
