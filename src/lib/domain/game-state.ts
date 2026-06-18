/**
 * Game state machine for QuizWiz.
 * Manages transitions: registration → round active → locked → published.
 * Also handles draft capture at lock and late-sync approval.
 */

export type RoundStatus = 'active' | 'locked' | 'published'
export type RegistrationStatus = 'open' | 'closed'

export interface RoundState {
  index: number
  status: RoundStatus
  draftSubmissions: Set<string> // team IDs with drafts at lock
  publishPending: Set<string> // team IDs with late-sync awaiting approval
}

export interface GameStateSnapshot {
  currentRoundIndex: number
  registrationOpen: boolean
  rounds: Map<number, RoundState>
}

/**
 * Create an initial game state for a game with N rounds.
 */
export function createGameState(totalRounds: number): GameStateSnapshot {
  const rounds = new Map<number, RoundState>()
  for (let i = 0; i < totalRounds; i++) {
    rounds.set(i, {
      index: i,
      status: 'active',
      draftSubmissions: new Set(),
      publishPending: new Set(),
    })
  }

  return {
    currentRoundIndex: 0,
    registrationOpen: true,
    rounds,
  }
}

/**
 * Close registration.
 */
export function closeRegistration(state: GameStateSnapshot): GameStateSnapshot {
  return {
    ...state,
    registrationOpen: false,
  }
}

/**
 * Re-open registration (for late teams).
 */
export function reopenRegistration(state: GameStateSnapshot): GameStateSnapshot {
  return {
    ...state,
    registrationOpen: true,
  }
}

/**
 * Lock the current round: team UI becomes read-only, drafts are captured.
 */
export function lockRound(state: GameStateSnapshot, draftTeamIds: Set<string>): GameStateSnapshot {
  const round = state.rounds.get(state.currentRoundIndex)
  if (!round) {
    throw new Error(`Round ${state.currentRoundIndex} not found`)
  }

  if (round.status !== 'active') {
    throw new Error(`Cannot lock round with status ${round.status}`)
  }

  const updatedRound: RoundState = {
    ...round,
    status: 'locked',
    draftSubmissions: new Set(draftTeamIds),
  }

  const newRounds = new Map(state.rounds)
  newRounds.set(state.currentRoundIndex, updatedRound)

  return {
    ...state,
    rounds: newRounds,
  }
}

/**
 * Unlock the current round (back to active).
 */
export function unlockRound(state: GameStateSnapshot): GameStateSnapshot {
  const round = state.rounds.get(state.currentRoundIndex)
  if (!round) {
    throw new Error(`Round ${state.currentRoundIndex} not found`)
  }

  if (round.status !== 'locked') {
    throw new Error(`Cannot unlock round with status ${round.status}`)
  }

  const updatedRound: RoundState = {
    ...round,
    status: 'active',
    draftSubmissions: new Set(),
    publishPending: new Set(),
  }

  const newRounds = new Map(state.rounds)
  newRounds.set(state.currentRoundIndex, updatedRound)

  return {
    ...state,
    rounds: newRounds,
  }
}

/**
 * Hold a late-syncing team's answer for host approval (via Status Override).
 */
export function holdLateSync(state: GameStateSnapshot, teamId: string): GameStateSnapshot {
  const round = state.rounds.get(state.currentRoundIndex)
  if (!round) {
    throw new Error(`Round ${state.currentRoundIndex} not found`)
  }

  const updatedRound: RoundState = {
    ...round,
    publishPending: new Set([...round.publishPending, teamId]),
  }

  const newRounds = new Map(state.rounds)
  newRounds.set(state.currentRoundIndex, updatedRound)

  return {
    ...state,
    rounds: newRounds,
  }
}

/**
 * Approve a held late-sync answer or a draft (host Status Override).
 */
export function approveLateSync(state: GameStateSnapshot, teamId: string): GameStateSnapshot {
  const round = state.rounds.get(state.currentRoundIndex)
  if (!round) {
    throw new Error(`Round ${state.currentRoundIndex} not found`)
  }

  const updatedPublishPending = new Set(round.publishPending)
  updatedPublishPending.delete(teamId)

  const updatedDrafts = new Set(round.draftSubmissions)
  updatedDrafts.delete(teamId)

  const updatedRound: RoundState = {
    ...round,
    publishPending: updatedPublishPending,
    draftSubmissions: updatedDrafts,
  }

  const newRounds = new Map(state.rounds)
  newRounds.set(state.currentRoundIndex, updatedRound)

  return {
    ...state,
    rounds: newRounds,
  }
}

/**
 * Check if a round is ready to publish.
 * All teams must be graded (drafts don't exempt from grading).
 * Pending late-syncs must be resolved before publishing.
 * Returns true if the round can be published OR host force-publishes.
 */
export function isRoundReadyToPublish(
  state: GameStateSnapshot,
  allTeamIds: Set<string>,
  gradedTeamIds: Set<string>,
  forcePublish: boolean = false
): boolean {
  if (forcePublish) {
    return true
  }

  const round = state.rounds.get(state.currentRoundIndex)
  if (!round || round.status !== 'locked') {
    return false
  }

  // Pending late-syncs must be resolved
  if (round.publishPending.size > 0) {
    return false
  }

  // All teams must be graded
  for (const teamId of allTeamIds) {
    if (!gradedTeamIds.has(teamId)) {
      return false
    }
  }

  return true
}

/**
 * Publish the current round (results visible on scoreboard).
 */
export function publishRound(state: GameStateSnapshot, forcePublish: boolean = false): GameStateSnapshot {
  const round = state.rounds.get(state.currentRoundIndex)
  if (!round) {
    throw new Error(`Round ${state.currentRoundIndex} not found`)
  }

  if (round.status !== 'locked') {
    throw new Error(`Cannot publish round with status ${round.status}`)
  }

  const updatedRound: RoundState = {
    ...round,
    status: 'published',
  }

  const newRounds = new Map(state.rounds)
  newRounds.set(state.currentRoundIndex, updatedRound)

  return {
    ...state,
    rounds: newRounds,
  }
}

/**
 * Advance to the next round.
 */
export function advanceRound(state: GameStateSnapshot): GameStateSnapshot {
  const nextRound = state.currentRoundIndex + 1
  if (nextRound >= state.rounds.size) {
    throw new Error(`Cannot advance past final round`)
  }

  return {
    ...state,
    currentRoundIndex: nextRound,
  }
}

/**
 * Check if a team can submit for the current round.
 * Returns false if the round is locked.
 */
export function canTeamSubmit(state: GameStateSnapshot): boolean {
  const round = state.rounds.get(state.currentRoundIndex)
  return round?.status === 'active'
}

/**
 * Idempotent submission key: (teamId, roundIndex, questionIndex).
 * Use to ensure double-submits are safe (last-write-wins).
 */
export function getSubmissionKey(teamId: string, roundIndex: number, questionIndex: number): string {
  return `${teamId}:${roundIndex}:${questionIndex}`
}
