export interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
}

export interface UserListResponse {
  rows: User[]
  total: number
}
