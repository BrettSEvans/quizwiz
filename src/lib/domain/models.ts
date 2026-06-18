/**
 * Domain models for QuizWiz.
 * These are pure data types with no database coupling.
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
  questions: Question[]
  type: 'standard' | 'optional' | 'custom'
}

export interface Package {
  rounds: Round[]
  tiebreaker: Question
}

export interface Answer {
  text: string
  musicalArtist?: string
  musicalYear?: string
  isDraft?: boolean
}

export interface TeamAnswers {
  [roundIndex: number]: {
    [questionIndex: number]: Answer
  }
}

export interface TeamScore {
  teamId: string
  teamName: string
  totalPoints: number
  scores: {
    [roundIndex: number]: {
      [questionIndex: number]: number
    }
  }
}

export interface GameRanking {
  teams: (TeamScore & { rank: number | string })[]
  tiedTeamIds: Set<string>
}

export interface GameState {
  currentRoundIndex: number
  roundStatus: 'active' | 'locked' | 'published'
  registrationOpen: boolean
}
