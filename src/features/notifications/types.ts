export type NotificationType = 
  | 'MATCH_INVITE' 
  | 'MATCH_ACCEPTED' 
  | 'MATCH_DECLINED' 
  | 'TEAM_INVITE'
  | 'MATCH_REMINDER'
  | 'MATCH_CANCELLED'
  | 'GENERAL'

export type NotificationStatus = 'UNREAD' | 'READ'

export interface NotificationData {
  matchId?: string
  inviteId?: string
  teamId?: string
  [key: string]: any
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  data: NotificationData
  status: NotificationStatus
  createdAt: string
  readAt?: string | null
}

export interface UnreadCountResponse {
  count: number
}

export interface NotificationsListResponse {
  items?: Notification[]
}

export interface MarkAllReadResponse {
  updated: number
}

export type NotificationStatusFilter = 'UNREAD' | 'ALL'

export interface ListNotificationsParams {
  status?: NotificationStatusFilter
  limit?: number
}
