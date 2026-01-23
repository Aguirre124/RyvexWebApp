export type SportFormat = 'FUTSAL' | 'F5' | 'F7' | 'F11'

export type FormatDetails = {
  id: string
  sportId: string
  name: SportFormat
  onFieldPlayers: number
  substitutesAllowed: number
  maxSquadSize: number
}

export type TeamSide = 'HOME' | 'AWAY'

export type Team = {
  id: string
  name: string
  isPublic: boolean
  captainId: string
  memberCount: number
}

export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export type Challenge = {
  id: string
  matchId: string
  challengedTeamId: string
  status: ChallengeStatus
  urlToShare: string
  createdAt: string
}

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export type Invite = {
  id: string
  matchId: string
  teamId: string
  inviteeEmail?: string
  inviteePhone?: string
  inviteeUserId?: string
  status: InviteStatus
  token: string
}

export type MatchStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'

export type Match = {
  id: string
  sportId: string
  formatId: string
  status: MatchStatus
  homeTeamId?: string
  awayTeamId?: string
  createdAt: string
}

export type TeamRoster = {
  id?: string
  teamId: string
  teamName: string
  name?: string
  side: TeamSide
  invitedCount: number
  acceptedCount: number
  minRequired: number
  maxAllowed: number
  _count?: {
    invites?: number
    rosters?: number
  }
}

export type MatchTeamSummary = {
  id: string
  matchId: string
  teamId: string
  side: 'HOME' | 'AWAY'
  onFieldPlayers: number
  substitutesAllowed: number
  maxSquadSize: number
  team: {
    id: string
    name: string
    logoUrl?: string | null
  }
  _count?: {
    invites?: number
    rosters?: number
  }
  rosters?: Array<{
    userId: string
    suggestedRoleCode?: string
    user?: {
      name: string
      avatarUrl?: string | null
    }
  }>
}

export type MatchSummary = {
  id: string
  formatId: string
  status: MatchStatus
  matchTeams: MatchTeamSummary[]
  // Legacy fields for backward compatibility
  match?: Match
  format?: FormatDetails & { code?: string }
  homeTeam?: TeamRoster | null
  awayTeam?: TeamRoster | null
  challenge?: Challenge
}
