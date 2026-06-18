import { describe, it, expect, beforeEach } from 'vitest'
import {
  createManualTeam,
  isManualTeamEligibleToScore,
  assignManualScores,
  type ManualTeam,
} from '../manual-team-entry'
import type { GameStateSnapshot } from '../game-state'

describe('Manual Team Entry', () => {
  let gameState: GameStateSnapshot

  beforeEach(() => {
    gameState = {
      currentRoundIndex: 0,
      roundStatus: 'active',
      registrationOpen: true,
      teams: [
        {
          id: 't1',
          name: 'Team A',
          status: 'active',
          answers: {},
          scores: {},
          isManual: false,
        },
      ] as any,
    } as any
  })

  describe('createManualTeam', () => {
    it('should create a manual team without join token', () => {
      const team = createManualTeam('John Host', 'Test Team')
      expect(team.name).toBe('Test Team')
      expect(team.isManual).toBe(true)
      expect(team.id).toBeDefined()
    })

    it('should mark team with isManual flag', () => {
      const team = createManualTeam('John Host', 'Manual Team')
      expect(team.isManual).toBe(true)
    })

    it('should not require team token', () => {
      const team = createManualTeam('John Host', 'Test Team')
      expect(team.teamToken).toBeUndefined()
    })

    it('should initialize empty answers and scores', () => {
      const team = createManualTeam('John Host', 'Test Team')
      expect(team.answers).toEqual({})
      expect(team.scores).toEqual({})
    })

    it('should have active status by default', () => {
      const team = createManualTeam('John Host', 'Test Team')
      expect(team.status).toBe('active')
    })

    it('should generate unique IDs', () => {
      const team1 = createManualTeam('John', 'Team 1')
      const team2 = createManualTeam('John', 'Team 2')
      expect(team1.id).not.toBe(team2.id)
    })
  })

  describe('isManualTeamEligibleToScore', () => {
    it('should return true for manual teams', () => {
      const team: ManualTeam = {
        id: 't1',
        name: 'Manual Team',
        status: 'active',
        answers: {},
        scores: {},
        isManual: true,
      }
      expect(isManualTeamEligibleToScore(team)).toBe(true)
    })

    it('should return true for regular active teams', () => {
      const team: ManualTeam = {
        id: 't1',
        name: 'Regular Team',
        status: 'active',
        answers: {},
        scores: {},
        isManual: false,
      }
      expect(isManualTeamEligibleToScore(team)).toBe(true)
    })

    it('should return false for soft-removed teams', () => {
      const team: ManualTeam = {
        id: 't1',
        name: 'Removed Team',
        status: 'soft_removed',
        answers: {},
        scores: {},
        isManual: false,
      }
      expect(isManualTeamEligibleToScore(team)).toBe(false)
    })

    it('should return false for manual soft-removed teams', () => {
      const team: ManualTeam = {
        id: 't1',
        name: 'Manual Removed',
        status: 'soft_removed',
        answers: {},
        scores: {},
        isManual: true,
      }
      expect(isManualTeamEligibleToScore(team)).toBe(false)
    })
  })

  describe('assignManualScores', () => {
    it('should assign scores for all questions in a round', () => {
      const manualTeam = createManualTeam('Host', 'Manual Team')
      const manualGameState = {
        ...gameState,
        teams: [...gameState.teams, manualTeam],
      }

      const scores = { 0: 2, 1: 1, 2: 0, 3: 2 }
      const updated = assignManualScores(manualGameState, manualTeam.id, 0, scores)

      const team = updated.teams.find((t) => t.id === manualTeam.id)
      expect(team?.scores?.[0]).toEqual(scores)
    })

    it('should work with zero scores', () => {
      const manualTeam = createManualTeam('Host', 'Manual Team')
      const manualGameState = {
        ...gameState,
        teams: [...gameState.teams, manualTeam],
      }

      const scores = { 0: 0, 1: 0, 2: 0, 3: 0 }
      const updated = assignManualScores(manualGameState, manualTeam.id, 0, scores)

      const team = updated.teams.find((t) => t.id === manualTeam.id)
      expect(team?.scores?.[0]).toEqual(scores)
    })

    it('should support multiple rounds', () => {
      const manualTeam = createManualTeam('Host', 'Manual Team')
      const manualGameState = {
        ...gameState,
        teams: [...gameState.teams, manualTeam],
      }

      let updated = assignManualScores(manualGameState, manualTeam.id, 0, { 0: 2, 1: 1, 2: 0, 3: 2 })
      updated = assignManualScores(updated, manualTeam.id, 1, { 0: 1, 1: 2, 2: 1, 3: 0 })

      const team = updated.teams.find((t) => t.id === manualTeam.id)
      expect(team?.scores?.[0]).toEqual({ 0: 2, 1: 1, 2: 0, 3: 2 })
      expect(team?.scores?.[1]).toEqual({ 0: 1, 1: 2, 2: 1, 3: 0 })
    })

    it('should maintain immutability', () => {
      const manualTeam = createManualTeam('Host', 'Manual Team')
      const manualGameState = {
        ...gameState,
        teams: [...gameState.teams, manualTeam],
      }

      const scores = { 0: 2, 1: 1, 2: 0, 3: 2 }
      const updated = assignManualScores(manualGameState, manualTeam.id, 0, scores)

      const originalTeam = manualGameState.teams.find((t) => t.id === manualTeam.id)
      expect(originalTeam?.scores).toEqual({})
      expect(updated.teams).not.toBe(manualGameState.teams)
    })

    it('should not affect other teams', () => {
      const regularTeam = gameState.teams[0]
      const manualTeam = createManualTeam('Host', 'Manual Team')
      const manualGameState = {
        ...gameState,
        teams: [...gameState.teams, manualTeam],
      }

      const scores = { 0: 2, 1: 1, 2: 0, 3: 2 }
      const updated = assignManualScores(manualGameState, manualTeam.id, 0, scores)

      const otherTeam = updated.teams.find((t) => t.id === regularTeam.id)
      expect(otherTeam?.scores).toEqual(regularTeam.scores)
    })
  })

  describe('mixed manual and regular teams', () => {
    it('should support both manual and regular teams in same game', () => {
      const regularTeam = gameState.teams[0]
      const manualTeam = createManualTeam('Host', 'Manual Team')
      const mixedGameState = {
        ...gameState,
        teams: [...gameState.teams, manualTeam],
      }

      expect(isManualTeamEligibleToScore(regularTeam as any)).toBe(true)
      expect(isManualTeamEligibleToScore(manualTeam)).toBe(true)

      const updated = assignManualScores(mixedGameState, manualTeam.id, 0, { 0: 2, 1: 1, 2: 0, 3: 2 })
      expect(updated.teams).toHaveLength(2)
    })
  })
})
