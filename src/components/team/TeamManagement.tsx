'use client'

import { useState } from 'react'
import { Team, Player, TEAM_COLORS, TeamColorId } from '@/types/game'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TeamManagementProps {
  teams: Team[]
  players: Player[]
  onCreateTeam: (teamName: string, teamColor: string) => void
  onUpdateTeam: (teamId: string, teamName: string, teamColor?: string) => void
  onDeleteTeam: (teamId: string) => void
  onAssignPlayer: (playerId: string, teamId: string) => void
  onRemovePlayerFromTeam: (playerId: string) => void
}

export function TeamManagement({
  teams,
  players,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onAssignPlayer,
  onRemovePlayerFromTeam,
}: TeamManagementProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [selectedColor, setSelectedColor] = useState<TeamColorId>(TEAM_COLORS[0].id)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState('')

  // Get available colors (not used by existing teams)
  const usedColors = teams.map((t) => t.color)
  const availableColors = TEAM_COLORS.filter(
    (c) => !usedColors.includes(c.id) || c.id === selectedColor
  )

  // Get players without teams
  const unassignedPlayers = players.filter((p) => !p.teamId)

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return

    onCreateTeam(newTeamName, selectedColor)
    setNewTeamName('')
    setIsCreating(false)

    // Select next available color
    const nextColor = TEAM_COLORS.find((c) => !usedColors.includes(c.id))
    if (nextColor) {
      setSelectedColor(nextColor.id)
    }
  }

  const handleUpdateTeam = (teamId: string) => {
    if (!editingTeamName.trim()) return

    onUpdateTeam(teamId, editingTeamName)
    setEditingTeamId(null)
    setEditingTeamName('')
  }

  const getTeamMembers = (teamId: string) => {
    return players.filter((p) => p.teamId === teamId)
  }

  const getTeamColor = (colorId: string) => {
    return TEAM_COLORS.find((c) => c.id === colorId) || TEAM_COLORS[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold">
          👥 Gestion des équipes
        </h3>
        {teams.length < 6 && !isCreating && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsCreating(true)}
          >
            + Créer une équipe
          </Button>
        )}
      </div>

      {/* Create Team Form */}
      {isCreating && (
        <div className="bg-bg-dark rounded-2xl p-6 border-2 border-primary/20 animate-fade-in">
          <h4 className="font-semibold mb-4">Nouvelle équipe</h4>

          <div className="space-y-4">
            {/* Team Name Input */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom de l'équipe
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ex: Les Champions"
                className="w-full px-4 py-2 bg-bg-medium border-2 border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Couleur
              </label>
              <div className="grid grid-cols-6 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={cn(
                      'w-12 h-12 rounded-xl border-2 transition-all',
                      selectedColor === color.id
                        ? 'border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setIsCreating(false)
                  setNewTeamName('')
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
              >
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => {
          const members = getTeamMembers(team.id)
          const teamColor = getTeamColor(team.color)
          const isEditing = editingTeamId === team.id

          return (
            <div
              key={team.id}
              className="bg-bg-dark rounded-2xl p-6 border-2"
              style={{ borderColor: teamColor.hex + '40' }}
            >
              {/* Team Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: teamColor.hex }}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      className="px-2 py-1 bg-bg-medium border border-border rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <h4 className="font-bold text-lg">{team.name}</h4>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingTeamId(null)
                          setEditingTeamName('')
                        }}
                        className="text-xs text-text-secondary hover:text-text-primary"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleUpdateTeam(team.id)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Valider
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingTeamId(team.id)
                          setEditingTeamName(team.name)
                        }}
                        className="text-xs text-text-secondary hover:text-text-primary"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteTeam(team.id)}
                        className="text-xs text-error hover:text-error/80"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Team Score */}
              <div className="text-2xl font-bold mb-3" style={{ color: teamColor.hex }}>
                {team.score} pts
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                <p className="text-xs text-text-secondary font-semibold uppercase">
                  Membres ({members.length})
                </p>
                {members.length === 0 ? (
                  <p className="text-sm text-text-secondary italic">
                    Aucun membre
                  </p>
                ) : (
                  <div className="space-y-1">
                    {members.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between py-1 px-2 bg-bg-medium rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-sm">{player.name}</span>
                          <span className="text-xs text-text-secondary">
                            ({player.score} pts)
                          </span>
                        </div>
                        <button
                          onClick={() => onRemovePlayerFromTeam(player.id)}
                          className="text-xs text-text-secondary hover:text-error"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-bg-dark rounded-2xl p-6 border-2 border-warning/20">
          <h4 className="font-semibold mb-3 text-warning">
            ⚠️ Joueurs sans équipe ({unassignedPlayers.length})
          </h4>
          <div className="space-y-2">
            {unassignedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between py-2 px-3 bg-bg-medium rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span>{player.name}</span>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssignPlayer(player.id, e.target.value)
                    }
                  }}
                  className="px-3 py-1 bg-bg-dark border border-border rounded-lg text-sm cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Assigner à...
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {teams.length === 0 && !isCreating && (
        <div className="text-center py-12 bg-bg-dark rounded-2xl border-2 border-dashed border-border">
          <p className="text-text-secondary mb-4">
            Aucune équipe créée. Créez votre première équipe !
          </p>
          <Button
            variant="primary"
            size="medium"
            onClick={() => setIsCreating(true)}
          >
            + Créer une équipe
          </Button>
        </div>
      )}
    </div>
  )
}
