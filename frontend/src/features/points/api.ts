import { apiClient } from '../../lib/api-client'
import type { User } from './types'

export function fetchUser(): Promise<User> {
  return apiClient.get<User>('/user')
}
