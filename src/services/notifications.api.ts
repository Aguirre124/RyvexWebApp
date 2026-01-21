import apiClient from './apiClient'
import type {
  Notification,
  UnreadCountResponse,
  NotificationsListResponse,
  MarkAllReadResponse,
  ListNotificationsParams
} from '../features/notifications/types'

/**
 * Fetch unread notifications count
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
  return response.data
}

/**
 * List notifications with optional filters
 * Supports both array response and { items: [] } wrapper
 */
export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<Notification[]> {
  const { status = 'UNREAD', limit = 20 } = params
  
  const response = await apiClient.get<Notification[] | NotificationsListResponse>(
    '/notifications',
    { params: { status, limit } }
  )
  
  // Handle both response formats: array or { items: [] }
  const items = Array.isArray(response.data) 
    ? response.data 
    : response.data.items || []
  
  return items
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<Notification> {
  const response = await apiClient.patch<Notification>(`/notifications/${id}/read`)
  return response.data
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<MarkAllReadResponse> {
  const response = await apiClient.patch<MarkAllReadResponse>('/notifications/read-all')
  return response.data
}
