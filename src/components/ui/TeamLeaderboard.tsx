'use client'

import { Team, Player, TEAM_COLORS } from '@/types/game'
import { cn } from '@/lib/utils'

interface TeamLeaderboardProps {
  teams: Team[]
  players: Player[]
  compact?: boolean
  showMembers?: boolean
  className?: string
}

export function TeamLeaderboard({
  teams,
  players,
  compact = false,
  showMembers = true,
  className,
}: TeamLeaderboardProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)

  const getTeamColor = (colorId: string) => {
    return TEAM_COLORS.find((c) => c.id === colorId) || TEAM_COLORS[0]
  }

  const getTeamMembers = (teamId: string) => {
    return players.filter((p) => p.teamId === teamId)
  }

  if (teams.length === 0) {
    return (
      <div className={cn('text-center p-8 text-text-secondary', className)}>
        <div className="text-4xl mb-2">👥</div>
        <p>Aucune équipe créée</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sortedTeams.map((team, index) => {
        const isTop3 = index < 3
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null
        const teamColor = getTeamColor(team.color)
        const members = getTeamMembers(team.id)
        const sortedMembers = [...members].sort((a, b) => b.score - a.score)

        return (
          <div
            key={team.id}
            className={cn(
              'rounded-2xl transition-all border-2',
              isTop3
                ? 'bg-gradient-to-r from-bg-card to-bg-medium'
                : 'bg-bg-card',
              compact ? 'p-3' : 'p-4'
            )}
            style={{
              borderColor: isTop3 ? teamColor.hex + '60' : 'transparent',
            }}
          >
            {/* Team Header */}
            <div className="flex items-center justify-between">
              {/* Left: Position + Team Info */}
              <div className="flex items-center gap-4 flex-1">
                {/* Medal or Position */}
                <div
                  className={cn(
                    'font-display font-bold',
                    compact ? 'text-2xl' : 'text-3xl'
                  )}
                >
                  {medal || `${index + 1}.`}
                </div>

                {/* Team Color Circle */}
                <div
                  className={cn(
                    'rounded-full',
                    compact ? 'w-4 h-4' : 'w-6 h-6'
                  )}
                  style={{ backgroundColor: teamColor.hex }}
                />

                {/* Team Name */}
                <div>
                  <div
                    className={cn(
                      'font-display font-bold',
                      compact ? 'text-base' : 'text-xl'
                    )}
                    style={{ color: teamColor.hex }}
                  >
                    {team.name}
                  </div>
                  {!compact && (
                    <div className="text-xs text-text-secondary">
                      {members.length} {members.length === 1 ? 'membre' : 'membres'}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Team Score */}
              <div
                className={cn(
                  'font-display font-bold',
                  compact ? 'text-xl' : 'text-3xl'
                )}
                style={{ color: teamColor.hex }}
              >
                {team.score}
              </div>
            </div>

            {/* Team Members (expandable) */}
            {showMembers && members.length > 0 && !compact && (
              <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
                {sortedMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-1 rounded-lg bg-bg-dark/50 transition-all",
                      !member.isConnected && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="text-sm">{member.name}</span>
                      {!member.isConnected && (
                        <span className="text-xs text-yellow-400">⚠️</span>
                      )}
                    </div>
                    <span className="text-sm text-text-secondary font-semibold">
                      {member.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
