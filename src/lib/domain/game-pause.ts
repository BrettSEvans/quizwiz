/**
 * Game pause/resume domain logic - supports operational flexibility for live bar gameplay.
 * Enables pausing and resuming games, skipping rounds.
 */

import type { GameStateSnapshot } from './game-state'

export interface GameStateWithPause extends GameStateSnapshot {
  isPaused?: boolean
}

export type GameStatus = 'running' | 'paused' | 'locked' | 'completed'

export function pauseGame(gameState: GameStateWithPause): GameStateWithPause {
  return {
    ...gameState,
    isPaused: true,
  }
}

export function resumeGame(gameState: GameStateWithPause): GameStateWithPause {
  return {
    ...gameState,
    isPaused: false,
  }
}

export function getGameStatus(gameState: GameStateWithPause): GameStatus {
  if (gameState.isPaused) {
    return 'paused'
  }

  const currentRound = (gameState.rounds as any)?.get?.(gameState.currentRoundIndex)
  const roundStatus = currentRound?.status

  if (roundStatus === 'locked') {
    return 'locked'
  }

  if (roundStatus === 'published' && gameState.currentRoundIndex > 0) {
    return 'completed'
  }

  return 'running'
}

export function canTeamSubmitDuringPause(gameState: GameStateWithPause): boolean {
  if (gameState.isPaused) {
    return false
  }

  const currentRound = (gameState.rounds as any)?.get?.(gameState.currentRoundIndex)
  const roundStatus = currentRound?.status

  if (roundStatus === 'locked') {
    return false
  }

  return true
}

export function skipRound(gameState: GameStateWithPause): GameStateWithPause {
  const rounds = new Map((gameState.rounds as any)) as any
  const currentRound = rounds.get(gameState.currentRoundIndex)
  if (currentRound) {
    rounds.set(gameState.currentRoundIndex, {
      ...currentRound,
      status: 'published',
    })
  }

  return {
    ...gameState,
    currentRoundIndex: gameState.currentRoundIndex + 1,
    rounds: rounds as any,
    isPaused: false, // Skip implicitly resumes the game
  }
}
