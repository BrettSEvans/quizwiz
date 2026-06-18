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

  if (gameState.roundStatus === 'locked') {
    return 'locked'
  }

  if (gameState.roundStatus === 'published' && gameState.currentRoundIndex > 0) {
    return 'completed'
  }

  return 'running'
}

export function canTeamSubmitDuringPause(gameState: GameStateWithPause): boolean {
  if (gameState.isPaused) {
    return false
  }

  if (gameState.roundStatus === 'locked') {
    return false
  }

  return true
}

export function skipRound(gameState: GameStateWithPause): GameStateWithPause {
  return {
    ...gameState,
    currentRoundIndex: gameState.currentRoundIndex + 1,
    roundStatus: 'published',
    isPaused: false, // Skip implicitly resumes the game
  }
}
