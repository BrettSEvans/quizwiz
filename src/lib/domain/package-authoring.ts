/**
 * Package authoring domain logic - pure functions for creating and editing trivia packages.
 * No database coupling, fully testable.
 */

export interface Question {
  id: string
  index: number
  text: string
  type: 'standard' | 'musical' | 'bonus' | 'custom'
  musicalArtistLabel?: string
  musicalYearLabel?: string
}

export interface Round {
  id: string
  index: number
  name: string
  type: 'standard' | 'optional' | 'custom'
  questions: Question[]
}

export interface DraftPackage {
  id: string
  name: string
  status: 'draft' | 'published'
  rounds: Round[]
  tiebreaker?: Question
}

export interface FrozenPackage {
  id: string
  name: string
  rounds: Round[]
  tiebreaker: Question
  frozenAt: Date
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function createPackage(name: string): DraftPackage {
  return {
    id: `pkg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    status: 'draft',
    rounds: [],
  }
}

export function addRound(
  pkg: DraftPackage,
  roundIndex: number,
  roundName: string,
  roundType: 'standard' | 'optional' | 'custom'
): DraftPackage {
  const newRound: Round = {
    id: `round_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    index: roundIndex,
    name: roundName,
    type: roundType,
    questions: [],
  }

  // Re-index existing rounds that come after the insertion point
  const updatedRounds = pkg.rounds
    .map((r) => ({
      ...r,
      index: r.index >= roundIndex ? r.index + 1 : r.index,
    }))
    .concat(newRound)
    .sort((a, b) => a.index - b.index)

  return {
    ...pkg,
    rounds: updatedRounds,
  }
}

export function addQuestion(
  pkg: DraftPackage,
  roundIndex: number,
  questionIndex: number,
  text: string,
  type: 'standard' | 'musical' | 'bonus' | 'custom',
  labels?: { artistLabel: string; yearLabel: string }
): DraftPackage {
  const roundIdx = pkg.rounds.findIndex((r) => r.index === roundIndex)
  if (roundIdx === -1) return pkg

  const newQuestion: Question = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    index: questionIndex,
    text,
    type,
    ...(type === 'musical' && labels
      ? {
          musicalArtistLabel: labels.artistLabel,
          musicalYearLabel: labels.yearLabel,
        }
      : {}),
  }

  const updatedRound = {
    ...pkg.rounds[roundIdx],
    questions: pkg.rounds[roundIdx].questions
      .map((q) => ({
        ...q,
        index: q.index >= questionIndex ? q.index + 1 : q.index,
      }))
      .concat(newQuestion)
      .sort((a, b) => a.index - b.index),
  }

  const newRounds = [...pkg.rounds]
  newRounds[roundIdx] = updatedRound

  return {
    ...pkg,
    rounds: newRounds,
  }
}

export function setTiebreaker(pkg: DraftPackage, question: Question): DraftPackage {
  return {
    ...pkg,
    tiebreaker: question,
  }
}

export function validatePackage(pkg: DraftPackage): ValidationResult {
  const errors: string[] = []

  if (pkg.rounds.length === 0) {
    errors.push('Package must have at least 1 round')
  }

  if (pkg.rounds.length > 20) {
    errors.push('Package cannot exceed 20 rounds')
  }

  const hasInsufficientQuestions = pkg.rounds.some((r) => r.questions.length < 4)
  if (hasInsufficientQuestions) {
    errors.push('Each round must have at least 4 questions')
  }

  if (!pkg.tiebreaker) {
    errors.push('Tiebreaker question must be set')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function updateRound(
  pkg: DraftPackage,
  roundIndex: number,
  name: string,
  type: 'standard' | 'optional' | 'custom'
): DraftPackage {
  const roundIdx = pkg.rounds.findIndex((r) => r.index === roundIndex)
  if (roundIdx === -1) return pkg

  const newRounds = [...pkg.rounds]
  newRounds[roundIdx] = {
    ...newRounds[roundIdx],
    name,
    type,
  }

  return {
    ...pkg,
    rounds: newRounds,
  }
}

export function updateQuestion(
  pkg: DraftPackage,
  roundIndex: number,
  questionIndex: number,
  text: string,
  type: 'standard' | 'musical' | 'bonus' | 'custom',
  labels?: { artistLabel: string; yearLabel: string }
): DraftPackage {
  const roundIdx = pkg.rounds.findIndex((r) => r.index === roundIndex)
  if (roundIdx === -1) return pkg

  const qIdx = pkg.rounds[roundIdx].questions.findIndex((q) => q.index === questionIndex)
  if (qIdx === -1) return pkg

  const updatedQuestion: Question = {
    ...pkg.rounds[roundIdx].questions[qIdx],
    text,
    type,
    ...(type === 'musical' && labels
      ? {
          musicalArtistLabel: labels.artistLabel,
          musicalYearLabel: labels.yearLabel,
        }
      : {
          musicalArtistLabel: undefined,
          musicalYearLabel: undefined,
        }),
  }

  const updatedQuestions = [...pkg.rounds[roundIdx].questions]
  updatedQuestions[qIdx] = updatedQuestion

  const updatedRound = {
    ...pkg.rounds[roundIdx],
    questions: updatedQuestions,
  }

  const newRounds = [...pkg.rounds]
  newRounds[roundIdx] = updatedRound

  return {
    ...pkg,
    rounds: newRounds,
  }
}

export function deleteQuestion(
  pkg: DraftPackage,
  roundIndex: number,
  questionIndex: number
): DraftPackage {
  const roundIdx = pkg.rounds.findIndex((r) => r.index === roundIndex)
  if (roundIdx === -1) return pkg

  const qIdx = pkg.rounds[roundIdx].questions.findIndex((q) => q.index === questionIndex)
  if (qIdx === -1) return pkg

  const deletedQuestion = pkg.rounds[roundIdx].questions[qIdx]
  const isTiebreaker = pkg.tiebreaker?.id === deletedQuestion.id

  const updatedQuestions = pkg.rounds[roundIdx].questions
    .filter((_, idx) => idx !== qIdx)
    .map((q, newIdx) => ({
      ...q,
      index: newIdx,
    }))

  const updatedRound = {
    ...pkg.rounds[roundIdx],
    questions: updatedQuestions,
  }

  const newRounds = [...pkg.rounds]
  newRounds[roundIdx] = updatedRound

  return {
    ...pkg,
    rounds: newRounds,
    tiebreaker: isTiebreaker ? undefined : pkg.tiebreaker,
  }
}

export function deleteRound(pkg: DraftPackage, roundIndex: number): DraftPackage {
  const roundIdx = pkg.rounds.findIndex((r) => r.index === roundIndex)
  if (roundIdx === -1) return pkg

  const deletedRound = pkg.rounds[roundIdx]
  const isTiebreakerInRound = deletedRound.questions.some((q) => q.id === pkg.tiebreaker?.id)

  const updatedRounds = pkg.rounds
    .filter((_, idx) => idx !== roundIdx)
    .map((r, newIdx) => ({
      ...r,
      index: newIdx,
    }))

  return {
    ...pkg,
    rounds: updatedRounds,
    tiebreaker: isTiebreakerInRound ? undefined : pkg.tiebreaker,
  }
}

export function freezeForGameStart(pkg: DraftPackage, frozenAt: Date): FrozenPackage {
  if (!pkg.tiebreaker) {
    throw new Error('Cannot freeze package without tiebreaker')
  }

  return {
    id: pkg.id,
    name: pkg.name,
    rounds: JSON.parse(JSON.stringify(pkg.rounds)),
    tiebreaker: JSON.parse(JSON.stringify(pkg.tiebreaker)),
    frozenAt,
  }
}
