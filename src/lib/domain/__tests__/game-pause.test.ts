import { describe, it, expect, beforeEach } from 'vitest'
import {
  pauseGame,
  resumeGame,
  getGameStatus,
  canTeamSubmitDuringPause,
  skipRound,
  type GameStateWithPause,
} from '../game-pause'
import type { GameStateSnapshot } from '../game-state'

describe('Game Pause/Resume', () => {
  let gameState: GameStateWithPause

  beforeEach(() => {
    gameState = {
      currentRoundIndex: 0,
      roundStatus: 'active',
      registrationOpen: false,
      teams: [
        {
          id: 't1',
          name: 'Team A',
          status: 'active',
          answers: {},
          scores: {},
        },
      ] as any,
      isPaused: false,
    }
  })

  describe('pauseGame', () => {
    it('should set isPaused flag', () => {
      const updated = pauseGame(gameState)
      expect(updated.isPaused).toBe(true)
    })

    it('should preserve game state', () => {
      const updated = pauseGame(gameState)
      expect(updated.currentRoundIndex).toBe(gameState.currentRoundIndex)
      expect(updated.roundStatus).toBe(gameState.roundStatus)
    })

    it('should be idempotent', () => {
      const paused1 = pauseGame(gameState)
      const paused2 = pauseGame(paused1)
      expect(paused2.isPaused).toBe(true)
    })

    it('should maintain immutability', () => {
      const updated = pauseGame(gameState)
      expect(gameState.isPaused).toBe(false)
      expect(updated.isPaused).toBe(true)
    })
  })

  describe('resumeGame', () => {
    it('should clear isPaused flag', () => {
      let updated = pauseGame(gameState)
      updated = resumeGame(updated)
      expect(updated.isPaused).toBe(false)
    })

    it('should preserve game state', () => {
      let updated = pauseGame(gameState)
      updated = resumeGame(updated)
      expect(updated.currentRoundIndex).toBe(0)
      expect(updated.teams).toHaveLength(1)
    })

    it('should be safe on non-paused games', () => {
      const updated = resumeGame(gameState)
      expect(updated.isPaused).toBe(false)
    })

    it('should maintain immutability', () => {
      let updated = pauseGame(gameState)
      const before = updated
      updated = resumeGame(updated)
      expect(before).not.toBe(updated)
    })
  })

  describe('getGameStatus', () => {
    it('should return running for active game', () => {
      expect(getGameStatus(gameState)).toBe('running')
    })

    it('should return paused when isPaused is true', () => {
      const paused = pauseGame(gameState)
      expect(getGameStatus(paused)).toBe('paused')
    })

    it('should return locked when round is locked', () => {
      const locked = { ...gameState, roundStatus: 'locked' as const }
      expect(getGameStatus(locked)).toBe('locked')
    })

    it('should return completed when game is done', () => {
      const completed = {
        ...gameState,
        roundStatus: 'published' as const,
        currentRoundIndex: 10,
      }
      expect(getGameStatus(completed)).toBe('completed')
    })
  })

  describe('canTeamSubmitDuringPause', () => {
    it('should return false when paused', () => {
      const paused = pauseGame(gameState)
      expect(canTeamSubmitDuringPause(paused)).toBe(false)
    })

    it('should return true when not paused', () => {
      expect(canTeamSubmitDuringPause(gameState)).toBe(true)
    })

    it('should return false when round is locked', () => {
      const locked = { ...gameState, roundStatus: 'locked' as const }
      expect(canTeamSubmitDuringPause(locked)).toBe(false)
    })

    it('should return false when both paused and locked', () => {
      const pausedAndLocked = {
        ...pauseGame(gameState),
        roundStatus: 'locked' as const,
      }
      expect(canTeamSubmitDuringPause(pausedAndLocked)).toBe(false)
    })
  })

  describe('skipRound', () => {
    it('should advance to next round', () => {
      const updated = skipRound(gameState)
      expect(updated.currentRoundIndex).toBe(1)
    })

    it('should set round status to published', () => {
      const updated = skipRound(gameState)
      expect(updated.roundStatus).toBe('published')
    })

    it('should preserve other game state', () => {
      const updated = skipRound(gameState)
      expect(updated.teams).toEqual(gameState.teams)
    })

    it('should work from any round index', () => {
      const advanced = {
        ...gameState,
        currentRoundIndex: 5,
      }
      const updated = skipRound(advanced)
      expect(updated.currentRoundIndex).toBe(6)
    })

    it('should maintain immutability', () => {
      const updated = skipRound(gameState)
      expect(gameState.currentRoundIndex).toBe(0)
      expect(updated.currentRoundIndex).toBe(1)
    })
  })

  describe('combined pause/resume operations', () => {
    it('should handle pause-resume-pause cycle', () => {
      let state = gameState
      state = pauseGame(state)
      expect(state.isPaused).toBe(true)
      state = resumeGame(state)
      expect(state.isPaused).toBe(false)
      state = pauseGame(state)
      expect(state.isPaused).toBe(true)
    })

    it('should allow skip during pause and resume game', () => {
      let state = pauseGame(gameState)
      state = skipRound(state)
      expect(state.isPaused).toBe(false) // Skip implicitly resumes
      expect(state.currentRoundIndex).toBe(1)
      expect(state.roundStatus).toBe('published')
    })

    it('should reflect status correctly after operations', () => {
      let state = gameState
      expect(getGameStatus(state)).toBe('running')
      state = pauseGame(state)
      expect(getGameStatus(state)).toBe('paused')
      state = skipRound(state)
      expect(getGameStatus(state)).toBe('completed')
    })
  })
})
