import { api } from '@/lib/axios'
import type { UserListResponse } from '../types'

export interface UserListParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
}

export const usersApi = {
  getList: (params: UserListParams): Promise<UserListResponse> =>
    api.get('/users', { params }).then((res) => res.data),
}
