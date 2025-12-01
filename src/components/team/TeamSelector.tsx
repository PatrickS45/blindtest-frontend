'use client'

import { Team, TEAM_COLORS } from '@/types/game'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TeamSelectorProps {
  teams: Team[]
  selectedTeamId: string | null
  onSelectTeam: (teamId: string) => void
  onConfirm: () => void
}

export function TeamSelector({
  teams,
  selectedTeamId,
  onSelectTeam,
  onConfirm,
}: TeamSelectorProps) {
  const getTeamColor = (colorId: string) => {
    return TEAM_COLORS.find((c) => c.id === colorId) || TEAM_COLORS[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-hero font-display font-bold mb-4">
            <span className="text-gradient-primary">👥 Choisis ton équipe</span>
          </h1>
          <p className="text-text-secondary">
            Sélectionne l'équipe que tu veux rejoindre
          </p>
        </div>

        {/* Teams Grid */}
        {teams.length > 0 ? (
          <div
            className={cn(
              'grid gap-4 mb-8',
              teams.length === 2 && 'grid-cols-2',
              teams.length === 3 && 'grid-cols-3',
              teams.length >= 4 && 'grid-cols-2 md:grid-cols-3'
            )}
          >
            {teams.map((team) => {
              const teamColor = getTeamColor(team.color)
              const isSelected = selectedTeamId === team.id

              return (
                <button
                  key={team.id}
                  onClick={() => onSelectTeam(team.id)}
                  className={cn(
                    'p-6 rounded-3xl border-4 transition-all duration-200 animate-fade-in',
                    isSelected
                      ? 'scale-105 shadow-2xl'
                      : 'hover:scale-102 opacity-80 hover:opacity-100'
                  )}
                  style={{
                    borderColor: isSelected ? teamColor.hex : teamColor.hex + '40',
                    backgroundColor: isSelected
                      ? teamColor.hex + '20'
                      : teamColor.hex + '10',
                  }}
                >
                  {/* Team Color Circle */}
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4"
                    style={{ backgroundColor: teamColor.hex }}
                  />

                  {/* Team Name */}
                  <h3
                    className="font-display text-2xl font-bold mb-2"
                    style={{ color: teamColor.hex }}
                  >
                    {team.name}
                  </h3>

                  {/* Team Score */}
                  <p className="text-text-secondary text-sm mb-3">
                    Score: <span className="font-bold">{team.score} pts</span>
                  </p>

                  {/* Team Members Count */}
                  <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                    <span>👤</span>
                    <span>
                      {team.memberIds.length}{' '}
                      {team.memberIds.length === 1 ? 'membre' : 'membres'}
                    </span>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="mt-4 animate-fade-in">
                      <div
                        className="inline-block px-4 py-1 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: teamColor.hex,
                          color: 'white',
                        }}
                      >
                        ✓ Sélectionné
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-bg-card rounded-3xl border-2 border-border mb-8">
            <p className="text-text-secondary">
              ⏳ En attente de création des équipes par l'hôte...
            </p>
          </div>
        )}

        {/* Confirm Button */}
        <div className="text-center">
          <Button
            variant="primary"
            size="xl"
            onClick={onConfirm}
            disabled={!selectedTeamId}
            className="min-w-[300px]"
          >
            {selectedTeamId ? 'Rejoindre l\'équipe →' : 'Sélectionne une équipe'}
          </Button>

          {selectedTeamId && (
            <p className="text-text-secondary text-sm mt-4 animate-fade-in">
              Tu rejoindras{' '}
              <span
                className="font-bold"
                style={{
                  color: getTeamColor(
                    teams.find((t) => t.id === selectedTeamId)?.color || 'red'
                  ).hex,
                }}
              >
                {teams.find((t) => t.id === selectedTeamId)?.name}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
